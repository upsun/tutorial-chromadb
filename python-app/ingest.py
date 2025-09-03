import os
import glob
import chromadb
from openai import OpenAI
from typing import List, Dict
import hashlib


def read_markdown_files(data_dir: str = "data") -> List[Dict[str, str]]:
    """Read all markdown files from the data directory."""
    md_files = glob.glob(os.path.join(data_dir, "*.md"))
    documents = []
    
    for file_path in md_files:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            documents.append({
                "content": content,
                "filename": os.path.basename(file_path),
                "filepath": file_path
            })
    
    return documents


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks


def get_embeddings(texts: List[str], openai_client: OpenAI) -> List[List[float]]:
    """Get embeddings for a list of texts using OpenAI."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [embedding.embedding for embedding in response.data]


def create_document_id(content: str, filename: str, chunk_idx: int) -> str:
    """Create a unique ID for a document chunk."""
    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
    return f"{filename}_{chunk_idx}_{content_hash}"


def get_chroma_client():
    """Create ChromaDB client based on environment variables."""
    # Check for remote ChromaDB configuration
    chroma_host = os.getenv("CHROMA_HOST")
    chroma_port = os.getenv("CHROMA_PORT", "8000")
    chroma_ssl = os.getenv("CHROMA_SSL", "false").lower() == "true"
    chroma_headers = {}
    
    # Optional authentication
    if os.getenv("CHROMA_AUTH_TOKEN"):
        chroma_headers["Authorization"] = f"Bearer {os.getenv('CHROMA_AUTH_TOKEN')}"
    
    if chroma_host:
        # Remote ChromaDB instance
        return chromadb.HttpClient(
            host=chroma_host,
            port=int(chroma_port),
            ssl=chroma_ssl,
            headers=chroma_headers
        )
    else:
        # Local ChromaDB instance
        return chromadb.Client()


def ingest_documents(data_dir: str = "data", collection_name: str = "python-app"):
    """Main ingestion function."""
    # Initialize clients
    openai_client = OpenAI()  # Expects OPENAI_API_KEY environment variable
    chroma_client = get_chroma_client()
    
    # Get or create collection and clear existing data
    try:
        collection = chroma_client.get_collection(name=collection_name)
        print(f"Found existing collection: {collection_name}")
        # Clear all existing data
        collection.delete()
        print(f"Cleared existing data from collection: {collection_name}")
    except Exception:
        # Collection doesn't exist, create it
        collection = chroma_client.create_collection(name=collection_name)
        print(f"Created new collection: {collection_name}")
    
    # Read markdown files
    documents = read_markdown_files(data_dir)
    print(f"Found {len(documents)} markdown files")
    
    # Process each document
    all_chunks = []
    all_metadatas = []
    all_ids = []
    
    for doc in documents:
        print(f"Processing: {doc['filename']}")
        
        # Chunk the document
        chunks = chunk_text(doc['content'])
        print(f"  Created {len(chunks)} chunks")
        
        # Create metadata for each chunk
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadatas.append({
                "filename": doc['filename'],
                "filepath": doc['filepath'],
                "chunk_index": i,
                "total_chunks": len(chunks)
            })
            all_ids.append(create_document_id(chunk, doc['filename'], i))
    
    print(f"Total chunks to process: {len(all_chunks)}")
    
    # Get embeddings in batches to avoid API limits
    batch_size = 100
    all_embeddings = []
    
    for i in range(0, len(all_chunks), batch_size):
        batch_chunks = all_chunks[i:i + batch_size]
        print(f"Getting embeddings for batch {i//batch_size + 1}/{(len(all_chunks)-1)//batch_size + 1}")
        
        batch_embeddings = get_embeddings(batch_chunks, openai_client)
        all_embeddings.extend(batch_embeddings)
    
    # Add to ChromaDB
    print("Storing in ChromaDB...")
    collection.add(
        documents=all_chunks,
        metadatas=all_metadatas,
        ids=all_ids,
        embeddings=all_embeddings
    )
    
    print(f"Successfully ingested {len(all_chunks)} chunks into collection '{collection_name}'")
    return collection


if __name__ == "__main__":
    ingest_documents()