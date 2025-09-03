import os
import chromadb
from flask import Flask, render_template_string
from collections import defaultdict

app = Flask(__name__)


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

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Python App - Document Collection</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .file-item { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .file-name { font-weight: bold; color: #2c3e50; font-size: 18px; }
        .chunk-count { color: #7f8c8d; font-size: 14px; margin-top: 5px; }
        .error { color: #e74c3c; }
        .success { color: #27ae60; }
        .total { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Document Collection: python-app</h1>
    
    {% if error %}
        <div class="error">{{ error }}</div>
    {% else %}
        <div class="total">
            <strong>Total Files:</strong> {{ total_files }}<br>
            <strong>Total Chunks:</strong> {{ total_chunks }}
        </div>
        
        {% for file_info in files %}
        <div class="file-item">
            <div class="file-name">📄 {{ file_info.filename }}</div>
            <div class="chunk-count">{{ file_info.chunk_count }} chunks</div>
        </div>
        {% endfor %}
    {% endif %}
</body>
</html>
"""

@app.route('/')
def list_files():
    try:
        chroma_client = get_chroma_client()
        collection = chroma_client.get_collection(name="python-app")
        
        # Get all metadata to analyze files
        result = collection.get()
        metadatas = result['metadatas']
        
        if not metadatas:
            return render_template_string(HTML_TEMPLATE, 
                                        error="No documents found in the collection. Run ingest.py first.")
        
        # Group chunks by filename
        file_chunks = defaultdict(int)
        for metadata in metadatas:
            filename = metadata.get('filename', 'Unknown')
            file_chunks[filename] += 1
        
        # Prepare file information for template
        files = []
        for filename, chunk_count in sorted(file_chunks.items()):
            files.append({
                'filename': filename,
                'chunk_count': chunk_count
            })
        
        return render_template_string(HTML_TEMPLATE,
                                    files=files,
                                    total_files=len(files),
                                    total_chunks=sum(file_chunks.values()))
        
    except ValueError as e:
        return render_template_string(HTML_TEMPLATE, 
                                    error=f"Collection 'python-app' not found. Please run ingest.py first.")
    except Exception as e:
        return render_template_string(HTML_TEMPLATE, 
                                    error=f"Error accessing ChromaDB: {str(e)}")

def main():
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()
