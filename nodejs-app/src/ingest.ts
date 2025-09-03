import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { createHash } from 'crypto';

interface Document {
  content: string;
  filename: string;
  filepath: string;
}

interface ChunkMetadata {
  filename: string;
  filepath: string;
  chunk_index: number;
  total_chunks: number;
  [key: string]: any;
}

function getChromaClient(): ChromaClient {
  const chromaHost = process.env.CHROMA_HOST;
  const chromaPort = parseInt(process.env.CHROMA_PORT || '8000');
  const chromaSsl = process.env.CHROMA_SSL?.toLowerCase() === 'true';
  
  if (chromaHost) {
    const auth = process.env.CHROMA_AUTH_TOKEN 
      ? { provider: 'token', credentials: process.env.CHROMA_AUTH_TOKEN }
      : undefined;
    
    return new ChromaClient({
      path: `http${chromaSsl ? 's' : ''}://${chromaHost}:${chromaPort}`,
      auth
    });
  } else {
    return new ChromaClient();
  }
}

function readMarkdownFiles(dataDir: string = 'data'): Document[] {
  const mdFiles = glob.sync(path.join(dataDir, '*.md'));
  const documents: Document[] = [];
  
  for (const filePath of mdFiles) {
    const content = readFileSync(filePath, 'utf-8');
    documents.push({
      content,
      filename: path.basename(filePath),
      filepath: filePath
    });
  }
  
  return documents;
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

async function getEmbeddings(texts: string[], openaiClient: OpenAI): Promise<number[][]> {
  const response = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts
  });
  
  return response.data.map(embedding => embedding.embedding);
}

function createDocumentId(content: string, filename: string, chunkIdx: number): string {
  const contentHash = createHash('md5').update(content).digest('hex').substring(0, 8);
  return `${filename}_${chunkIdx}_${contentHash}`;
}

export async function ingestDocuments(dataDir: string = 'data', collectionName: string = 'nodejs-app'): Promise<void> {
  // Initialize clients
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const chromaClient = getChromaClient();
  
  const embedder = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY!,
    openai_model: 'text-embedding-3-small'
  });
  
  // Get or create collection and clear existing data
  let collection;
  try {
    collection = await chromaClient.getCollection({ 
      name: collectionName,
      embeddingFunction: embedder
    });
    console.log(`Found existing collection: ${collectionName}`);
    // Clear all existing data
    await collection.delete();
    console.log(`Cleared existing data from collection: ${collectionName}`);
  } catch (error) {
    // Collection doesn't exist, create it
    collection = await chromaClient.createCollection({ 
      name: collectionName,
      embeddingFunction: embedder
    });
    console.log(`Created new collection: ${collectionName}`);
  }
  
  // Read markdown files
  const documents = readMarkdownFiles(dataDir);
  console.log(`Found ${documents.length} markdown files`);
  
  // Process each document
  const allChunks: string[] = [];
  const allMetadatas: ChunkMetadata[] = [];
  const allIds: string[] = [];
  
  for (const doc of documents) {
    console.log(`Processing: ${doc.filename}`);
    
    // Chunk the document
    const chunks = chunkText(doc.content);
    console.log(`  Created ${chunks.length} chunks`);
    
    // Create metadata for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      allChunks.push(chunk);
      allMetadatas.push({
        filename: doc.filename,
        filepath: doc.filepath,
        chunk_index: i,
        total_chunks: chunks.length
      });
      allIds.push(createDocumentId(chunk, doc.filename, i));
    }
  }
  
  console.log(`Total chunks to process: ${allChunks.length}`);
  
  // Add to ChromaDB (ChromaDB will handle embeddings automatically with the embedding function)
  console.log('Storing in ChromaDB...');
  await collection.add({
    documents: allChunks,
    metadatas: allMetadatas,
    ids: allIds
  });
  
  console.log(`Successfully ingested ${allChunks.length} chunks into collection '${collectionName}'`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDocuments().catch(console.error);
}