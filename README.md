# ChromaDB Document Ingestion & Listing Demo

**The full tutorial is available on the [Upsun Devcenter](https://devcenter.upsun.com/posts/store-embeddings-in-chroma-with-persistent-storage-nodejs-and-python-examples/).**

A multi-language demonstration of document ingestion and web-based listing using ChromaDB, OpenAI embeddings, and modern web frameworks. This project showcases identical functionality implemented in both Python and Node.js/TypeScript.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Markdown      │    │    ChromaDB      │    │   Web Apps      │
│   Documents     │────│   Collections    │────│  Python/Node.js │
│   (.md files)   │    │  (Embeddings)    │    │   (Listing UI)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   OpenAI API    │
                    │  (Embeddings)   │
                    └─────────────────┘
```

## Features

- **Document Ingestion**: Processes markdown files into semantic chunks
- **Vector Embeddings**: Uses OpenAI's `text-embedding-3-small` model
- **ChromaDB Storage**: Efficient vector database for similarity search
- **Web Interface**: Clean UI showing ingested files and chunk counts  
- **Multi-language**: Identical functionality in Python and TypeScript
- **Cloud Ready**: Configured for Upsun platform deployment
- **Environment Flexible**: Supports both local and remote ChromaDB instances

## Project Structure

```
├── python-app/           # Python Flask implementation
│   ├── main.py          # Web server (Flask)
│   ├── ingest.py        # Document processing script
│   ├── pyproject.toml   # Python dependencies
│   ├── data/            # Markdown files
│   └── .env.example     # Environment template
├── nodejs-app/          # Node.js TypeScript implementation  
│   ├── src/
│   │   ├── index.ts     # Web server (Express)
│   │   └── ingest.ts    # Document processing script
│   ├── package.json     # Node.js dependencies
│   ├── tsconfig.json    # TypeScript configuration
│   ├── data/            # Markdown files
│   └── .env.example     # Environment template
├── .upsun/
│   └── config.yaml      # Upsun platform configuration
└── README.md            # This file
```

## Technology Stack

### Python App
- **Flask** - Web framework
- **ChromaDB** - Vector database client
- **OpenAI** - Embedding generation
- **UV** - Fast Python package manager

### Node.js App  
- **Express** - Web framework
- **ChromaDB** - Vector database client  
- **OpenAI** - Embedding generation
- **TypeScript** - Type safety

### Infrastructure
- **ChromaDB** - Vector database server
- **Upsun** - Cloud platform
- **OpenAI API** - Embedding service

## Environment Configuration

Both applications support flexible ChromaDB connections via environment variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB Configuration (leave empty for local instance)
CHROMA_HOST=                    # e.g., chroma.example.com
CHROMA_PORT=8000               # Default: 8000
CHROMA_SSL=false               # true for HTTPS
CHROMA_AUTH_TOKEN=             # Optional authentication
```

## Local Development

### Python App

```bash
cd python-app

# Install dependencies
uv sync

# Set environment variables
cp .env.example .env
# Edit .env with your OpenAI API key

# Run ingestion (processes markdown files)
uv run python ingest.py

# Start web server
uv run python main.py
# Visit: http://localhost:5000
```

### Node.js App

```bash
cd nodejs-app

# Install dependencies
npm ci

# Set environment variables  
cp .env.example .env
# Edit .env with your OpenAI API key

# Build TypeScript
npm run build

# Run ingestion (processes markdown files)
npm run ingest

# Start web server
npm run start
# Visit: http://localhost:3000
```

## Deployment (Upsun)

This project is configured for deployment on the Upsun platform with three services:

1. **ChromaDB Service**: Vector database server
2. **Python App**: Flask web application  
3. **Node.js App**: Express web application

### Deployment URLs
- Python App: `https://python.{your-domain}/`
- Node.js App: `https://nodejs.{your-domain}/`

### Automatic Ingestion
Both applications automatically run their ingestion scripts during deployment, ensuring fresh data on every deploy.

## How It Works

### 1. Document Processing
- Reads all `.md` files from the `data/` directory
- Splits documents into overlapping chunks (1000 words, 200 word overlap)
- Generates unique IDs using content hashing

### 2. Embedding Generation
- **Python**: Manual OpenAI API calls with batching
- **Node.js**: ChromaDB's built-in OpenAI embedding function

### 3. Vector Storage
- Stores chunks with metadata (filename, filepath, chunk index)
- Collections named `python-app` and `nodejs-app` respectively
- Automatically clears existing data on re-ingestion

### 4. Web Interface
- Lists all processed files with chunk counts
- Shows collection statistics (total files, total chunks)
- Handles errors gracefully with helpful messages

## Development Commands

### Python App
```bash
# Type checking and linting (if available)
uv run python -m mypy .

# Run development server with auto-reload
uv run python main.py
```

### Node.js App
```bash
# Type checking
npm run type-check

# Development mode with auto-reload
npm run dev

# Development ingestion (uses tsx)
npm run ingest:dev
```

## Sample Data

The `data/` directories contain sample markdown files covering various technical topics:

- Advanced prompting techniques
- Platform.sh build pipelines  
- Python development with UV
- PyTorch deployment
- Configuration as code
- Environment management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both Python and Node.js implementations
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Links

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Upsun Platform](https://upsun.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Express.js Documentation](https://expressjs.com/)

## Troubleshooting

### Common Issues

**"Collection not found" error:**
- Run the ingestion script first: `python ingest.py` or `npm run ingest`

**OpenAI API errors:**
- Verify your `OPENAI_API_KEY` is set correctly
- Check your OpenAI account has sufficient credits

**ChromaDB connection issues:**
- For local development, ensure no `CHROMA_HOST` is set
- For remote instances, verify `CHROMA_HOST`, `CHROMA_PORT`, and `CHROMA_SSL` settings

**TypeScript compilation errors:**
- Run `npm run build` to compile TypeScript before using `npm run start`
- Use `npm run dev` for development with auto-compilation