---
title: "How to run PyTorch in an Upsun application?"
subtitle: "Building a Sentiment Analysis API"
date: 2025-05-01T14:00:00+00:00
image: /images/pytorch-running-on-upsun/pytorch.png
icon: tutorial
featured: true
author:
  - gmoigneu

sidebar:
  exclude: true
type: post

description: |
  Learn how to deploy a sentiment analysis application powered by PyTorch and FastAPI on the Upsun cloud platform
  
tags:
  - pytorch
  - sentiment-analysis
  - ai
  - models
  - python
  - fastapi
categories:
  - tutorials
  - featured
  - ai
math: false
# excludeSearch: true
---

PyTorch is one of the most popular deep learning frameworks, particularly for natural language processing tasks. This tutorial will guide you through creating a sentiment analysis API using **PyTorch** and **FastAPI**, then deploying it on the **Upsun** Cloud Application Platform.

## Prerequisites

- An Upsun account
- Basic knowledge of Python
- Familiarity with REST APIs
- Git installed on your local machine

## Setting Up a new Python application on Upsun

Let's start by creating a new Python application on Upsun. We'll use **Python 3.12**, which is well-supported by both PyTorch and Upsun.

### 1. Create a new project directory

First, let's create a new directory for our project and initialize it as a Git repository:

```bash {filename="Terminal"}
mkdir pytorch-sentiment-api
cd pytorch-sentiment-api
git init
```

### 2. Configure the Upsun project

Create the necessary Upsun configuration files to define our application's environment. First, create a `.upsun` directory and then a `config.yaml` file inside it:

```bash {filename="Terminal"}
mkdir -p .upsun
touch .upsun/config.yaml
```

Now, open the `config.yaml` file and add the following configuration:

```yaml {filename=".upsun/config.yaml"}
# Define the applications within the project
applications:
  # Name of the application (can be anything, 'api' used here)
  api:
    # Request a container with more memory, suitable for ML models
    container_profile: HIGH_MEMORY

    # Specify the language and version for the runtime environment
    type: "python:3.12"

    # Define persistent storage mounts for the application container
    mounts:
      # Mount a persistent storage volume named 'pycache' at /app/__pycache__
      # This persists compiled Python bytecode across deployments
      "__pycache__":
        source: "storage" # Use Upsun persistent storage
        source_path: "pycache" # Subdirectory within the storage volume
      # Mount a persistent storage volume named 'cache' at /app/.cache
      # Used by tools like pip or transformers to cache downloads
      ".cache":
        source: "storage"
        source_path: "cache"

    # Configuration for how the application serves web requests
    web:
      # The command Upsun runs to start the web server
      # Uses the PORT environment variable provided by Upsun
      commands:
        start: "uvicorn main:app --host 0.0.0.0 --port $PORT"
      # Defines how Upsun communicates with the application internally
      upstream:
        socket_family: tcp # Use TCP sockets
      # Defines how specific paths are handled
      locations:
        # For the root path "/"
        "/":
          root: ""
          passthru: true # Pass requests directly to the application (defined by commands.start)
          
    # Commands to run during different phases of the deployment process
    hooks:
      # Commands executed during the build phase
      build: |
        set -eux # Exit on error, print commands
        pip install --upgrade pip # Ensure pip is up-to-date
        pip install -r requirements.txt # Install dependencies
        # Compile Python files to bytecode for potentially faster startup
        python -m compileall .

# Define how incoming HTTP/HTTPS requests are routed to applications
routes:
  # Route requests for the default domain(s) configured for the environment
  "https://{default}/":
    type: upstream # Route to an application defined above
    upstream: "api:http" # Route to the 'api' application using HTTP
```

## Creating a FastAPI application for sentiment analysis

Now, let's create our FastAPI application that will serve as the API for our sentiment analysis model.

### 1. Set up the project structure

Let's organize our project with the following structure:

```
pytorch-sentiment-api/
├── .upsun/
│   └── config.yaml
├── main.py
├── model.py
├── requirements.txt
└── README.md
```

### 2. Define the requirements

Create a `requirements.txt` file with the necessary dependencies:

```txt {filename="requirements.txt"}
fastapi>=0.68.0
uvicorn>=0.15.0
--extra-index-url https://download.pytorch.org/whl/cpu
torch==2.1.0+cpu
transformers>=4.11.0
pydantic>=1.8.0
```

Notice how we're using the `--extra-index-url` directive to specify that we want the CPU-only version of PyTorch, which is much smaller and suitable for deployment on CPU based containers.

### 3. Create the Model module

Let's create a `model.py` file that will handle the sentiment analysis logic:

```python {filename="model.py"}
from transformers import pipeline
import torch

class SentimentModel:
    def __init__(self):
        # Verify we're using the CPU version
        print(f"CUDA available: {torch.cuda.is_available()}")
        print(f"PyTorch version: {torch.__version__}")
        
        # Load a small pretrained model for sentiment analysis
        self.classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            return_all_scores=True
        )
    
    def predict(self, text):
        """
        Predict the sentiment of the given text.
        Returns the sentiment (POSITIVE/NEGATIVE) and confidence score.
        """
        result = self.classifier(text)
        
        # Process the results
        scores = result[0]
        
        # Find the label with the highest score
        highest_score = max(scores, key=lambda x: x['score'])
        sentiment = highest_score['label']
        confidence = highest_score['score']
        
        return {
            "text": text,
            "sentiment": sentiment,
            "confidence": confidence,
            "all_scores": scores
        }
```

### 4. Create the FastAPI application

Now, let's create the `main.py` file for our FastAPI application:

```python {filename="main.py"}
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time
from model import SentimentModel

# Create the FastAPI app
app = FastAPI(
    title="Sentiment Analysis API",
    description="An API for sentiment analysis using PyTorch and transformers",
    version="1.0.0"
)

# Load the model (this might take a moment)
print("Loading sentiment analysis model...")
model = None

# Define request and response models
class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    text: str
    sentiment: str
    confidence: float

@app.on_event("startup")
async def startup_event():
    global model
    model = SentimentModel()
    print("Model loaded successfully!")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sentiment Analysis API"}

@app.post("/classification", response_model=SentimentResponse)
async def classify_sentiment(request: SentimentRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Empty text provided")
    
    try:
        # Perform the prediction
        result = model.predict(request.text)
        
        # Return the response
        return {
            "text": request.text,
            "sentiment": result["sentiment"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
```

## Deploying the application to Upsun

Now that we have our application ready, let's deploy it to Upsun.

### 1. Initialize Git repository

Make sure all files are added to Git:

```bash {filename="Terminal"}
git add .
git commit -m "Initial commit of PyTorch sentiment analysis API"
```

### 2. Create a new Upsun project

You can create a new Upsun project through the Upsun Console or using the Upsun CLI:

```bash {filename="Terminal"}
upsun project:create # and follow the prompts!
```

The Upsun remote should be set automatically on the repository. If it's not, use

```bash {filename="Terminal"}
upsun project:set {project_id}
```

### 3. Push to Upsun

Deploy your application by pushing your code to Upsun:

```bash {filename="Terminal"}
upsun push -y
```

Upsun will automatically build your application according to the configuration files we created. This process includes installing dependencies, compiling Python files, and starting the FastAPI server.

### 4. Access your application

Once the deployment is complete, you can access your application at the URL provided by the Upsun console or with `upsun url --primary`. You should see the welcome message when you visit the root endpoint.

## Testing the Sentiment Analysis API

Now that our application is deployed, let's test it by sending a request to the sentiment analysis endpoint.

### Using cURL

```bash {filename="Terminal"}
curl -X POST $(upsun url --primary --pipe)classification \
     -H "Content-Type: application/json" \
     -d '{"text": "I really enjoyed this movie, it was fantastic!"}'
```

You should receive a response like:

```json
{
  "text": "I really enjoyed this movie, it was fantastic!",
  "sentiment": "POSITIVE",
  "confidence": 0.9978765249252319
}
```

### Using the Swagger UI

FastAPI automatically generates interactive API documentation. You can access it by navigating to `/docs` on your application URL:

```bash {filename="Terminal"}
open $(upsun url --primary --pipe)docs
```

This will open the Swagger UI where you can test the API through a user-friendly interface.

![Swagger](/images/pytorch-running-on-upsun/swagger.png)

## Advanced considerations

### Model size and disk space

The DistilBERT model we're using is relatively small, but if you're working with larger models, you might need to increase the disk space and the memory allocated in the Upsun configuration.

### Performance optimization

For better performance, you might want to:

1. Pre-load the model during the build phase
2. Use model quantization to reduce size
3. Consider implementing caching for frequently requested inputs

## Conclusion

In this tutorial, you've learned how to:

1. Set up a Python application on Upsun
2. Create a FastAPI app with a sentiment analysis endpoint
3. Configure PyTorch (CPU version) for efficient deployment
4. Deploy and test your application

Upsun provides an excellent platform for hosting CPU-based PyTorch applications, with its flexible configuration options and robust scaling capabilities. This approach allows you to deliver machine learning functionality through APIs or in your application without managing complex infrastructure.

Happy coding and machine learning with Upsun!