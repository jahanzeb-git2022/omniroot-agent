#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set default Huggingface token if not provided
if [ -z "$HUGGINGFACE_API_KEY" ]; then
    echo "HUGGINGFACE_API_KEY environment variable is not set."
    echo "Using default token: YOUR_HUGGINGFACE_TOKEN"
    export HUGGINGFACE_API_KEY="YOUR_HUGGINGFACE_TOKEN"
fi

# Check for other API keys
if [ -z "$OPENAI_API_KEY" ]; then
    echo "OPENAI_API_KEY environment variable is not set."
    echo "OpenAI models will not be available unless configured in the UI."
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ANTHROPIC_API_KEY environment variable is not set."
    echo "Anthropic models will not be available unless configured in the UI."
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "GOOGLE_API_KEY environment variable is not set."
    echo "Google models will not be available unless configured in the UI."
fi

# Build and start the container
echo "Building and starting the Agentic Software-Development Tool..."
docker-compose up -d

# Check if the container started successfully
if [ $? -eq 0 ]; then
    echo "Container started successfully!"
    echo "Access the web interface at http://localhost:3000"
    echo "Press Ctrl+C to stop viewing logs"
    docker-compose logs -f
else
    echo "Failed to start the container. Please check the error messages above."
    exit 1
fi