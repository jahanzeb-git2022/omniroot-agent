#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Set default Huggingface token if not provided
if [ -z "$HUGGINGFACEHUB_API_TOKEN" ]; then
    echo "HUGGINGFACEHUB_API_TOKEN environment variable is not set."
    echo "Using default token: your_huggingface_token_here"
    export HUGGINGFACEHUB_API_TOKEN="your_huggingface_token_here"
fi

# Create directory for agent history
mkdir -p ~/.agent_history

# Pull the latest image
echo "Pulling the latest Agentic Dev Tool image..."
docker pull yourusername/agentic-dev-tool:latest

# Start the container
echo "Starting the Agentic Software-Development Tool..."
docker-compose -f docker-compose.simple.yml up -d

# Check if the container started successfully
if [ $? -eq 0 ]; then
    echo "Container started successfully!"
    echo "Access the web interface at http://localhost:3000"
    echo "Press Ctrl+C to stop viewing logs"
    docker-compose -f docker-compose.simple.yml logs -f
else
    echo "Failed to start the container. Please check the error messages above."
    exit 1
fi