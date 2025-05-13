#!/bin/bash

# Create required directories
mkdir -p /workspace/omniroot-agent/code
mkdir -p ~/.agent_history

# Set environment variables
export HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY:-"your_huggingface_token_here"}
export HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN:-$HUGGINGFACE_API_KEY}

# Create symbolic links for testing
ln -sf /workspace/omniroot-agent/code /sandbox/code 2>/dev/null || mkdir -p /sandbox/code
ln -sf ~/.agent_history /host_home/.agent_history 2>/dev/null || mkdir -p /host_home/.agent_history

# Install dependencies if needed
if ! pip list | grep -q "flask"; then
  echo "Installing dependencies..."
  cd /workspace/omniroot-agent/backend
  pip install -r requirements.txt
fi

# Run the backend
cd /workspace/omniroot-agent/backend
python -m flask run --host=0.0.0.0 --port=5000