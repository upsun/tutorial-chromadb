import express from 'express';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';

const app = express();

interface FileInfo {
  filename: string;
  chunk_count: number;
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

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <title>Node.js App - Document Collection</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .file-item { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .file-name { font-weight: bold; color: #2c3e50; font-size: 18px; }
        .chunk-count { color: #7f8c8d; font-size: 14px; margin-top: 5px; }
        .error { color: #e74c3c; }
        .success { color: #27ae60; }
        .total { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .tech-stack { background-color: #e8f4f8; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Document Collection: nodejs-app</h1>
    <div class="tech-stack">
        <strong>Tech Stack:</strong> Node.js + TypeScript + Express + ChromaDB + OpenAI
    </div>
    
    {{CONTENT}}
</body>
</html>
`;

app.get('/', async (req, res) => {
  try {
    const chromaClient = getChromaClient();
    const embedder = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY!,
      openai_model: 'text-embedding-3-small'
    });
    
    const collection = await chromaClient.getCollection({ 
      name: 'nodejs-app',
      embeddingFunction: embedder
    });
    
    // Get all metadata to analyze files
    const result = await collection.get();
    const metadatas = result.metadatas as unknown as ChunkMetadata[];
    
    if (!metadatas || metadatas.length === 0) {
      const errorContent = `<div class="error">No documents found in the collection. Run npm run ingest first.</div>`;
      return res.send(HTML_TEMPLATE.replace('{{CONTENT}}', errorContent));
    }
    
    // Group chunks by filename
    const fileChunks = new Map<string, number>();
    for (const metadata of metadatas) {
      const filename = metadata?.filename || 'Unknown';
      fileChunks.set(filename, (fileChunks.get(filename) || 0) + 1);
    }
    
    // Prepare file information for template
    const files: FileInfo[] = Array.from(fileChunks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([filename, chunk_count]) => ({ filename, chunk_count }));
    
    const totalChunks = Array.from(fileChunks.values()).reduce((sum, count) => sum + count, 0);
    
    let content = `
      <div class="total">
          <strong>Total Files:</strong> ${files.length}<br>
          <strong>Total Chunks:</strong> ${totalChunks}
      </div>
    `;
    
    for (const fileInfo of files) {
      content += `
        <div class="file-item">
            <div class="file-name">📄 ${fileInfo.filename}</div>
            <div class="chunk-count">${fileInfo.chunk_count} chunks</div>
        </div>
      `;
    }
    
    res.send(HTML_TEMPLATE.replace('{{CONTENT}}', content));
    
  } catch (error: any) {
    const errorMessage = error.message?.includes('does not exist') 
      ? "Collection 'nodejs-app' not found. Please run npm run ingest first."
      : `Error accessing ChromaDB: ${error.message}`;
    
    const errorContent = `<div class="error">${errorMessage}</div>`;
    res.send(HTML_TEMPLATE.replace('{{CONTENT}}', errorContent));
  }
});

function main() {
  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { app };