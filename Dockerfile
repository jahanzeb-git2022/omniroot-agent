# Use Node.js slim image as base
FROM node:18-slim

# Install Python and required tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    bash \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Create sandbox directory
RUN mkdir -p /sandbox/code

# Install backend dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json* /app/frontend/
WORKDIR /app/frontend
RUN npm install

# Copy and build frontend
COPY frontend/ /app/frontend/
RUN npm run build

# Create agent history directory
RUN mkdir -p /host_home/.agent_history

# Set working directory back to app root
WORKDIR /app

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Create required directories with proper permissions\n\
mkdir -p /host_home/.agent_history\n\
mkdir -p /sandbox/code\n\
chmod -R 755 /host_home/.agent_history\n\
chmod -R 755 /sandbox/code\n\
\n\
# Set up environment variables\n\
if [ -n "$HUGGINGFACEHUB_API_TOKEN" ] && [ -z "$HUGGINGFACE_API_KEY" ]; then\n\
  echo "Setting HUGGINGFACE_API_KEY from HUGGINGFACEHUB_API_TOKEN"\n\
  export HUGGINGFACE_API_KEY=$HUGGINGFACEHUB_API_TOKEN\n\
fi\n\
\n\
# Set default API key if not provided\n\
export HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY:-\"your_huggingface_token_here\"}\n\
export HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACE_API_KEY}\n\
\n\
# Print environment information\n\
echo "Environment:"\n\
echo "- HUGGINGFACE_API_KEY: ${HUGGINGFACE_API_KEY:0:5}... (${#HUGGINGFACE_API_KEY} chars)"\n\
echo "- OPENAI_API_KEY: ${OPENAI_API_KEY:+set}"\n\
echo "- ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+set}"\n\
echo "- GOOGLE_API_KEY: ${GOOGLE_API_KEY:+set}"\n\
\n\
# Start Flask backend with proper logging\n\
cd /app/backend\n\
mkdir -p logs\n\
echo "Starting Flask backend on 0.0.0.0:5000"\n\
gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 8 --timeout 120 --log-level info --error-logfile logs/gunicorn-error.log --access-logfile logs/gunicorn-access.log app:app &\n\
BACKEND_PID=$!\n\
\n\
# Wait for backend to start\n\
echo "Waiting for backend to start..."\n\
sleep 5\n\
\n\
# Check if backend is running\n\
if ! ps -p $BACKEND_PID > /dev/null; then\n\
  echo "ERROR: Backend failed to start. Check logs at /app/backend/logs/"\n\
  cat /app/backend/logs/gunicorn-error.log\n\
  exit 1\n\
fi\n\
\n\
# Start frontend server\n\
cd /app/frontend\n\
echo "Starting React frontend on 0.0.0.0:3000"\n\
npm start\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose ports for Flask and React
EXPOSE 5000 3000

# Set entrypoint
ENTRYPOINT ["/app/start.sh"]
