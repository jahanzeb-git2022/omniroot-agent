# Use Node.js slim image as base
FROM node:18-slim

# Install Python and required tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    bash \
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
# Ensure history directory exists\n\
mkdir -p /host_home/.agent_history\n\
\n\
# Set Hugging Face API key if not provided\n\
export HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY:-\"your_huggingface_token_here\"}\n\
\n\
# Start Flask backend\n\
cd /app/backend\n\
gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 8 app:app &\n\
\n\
# Start frontend server\n\
cd /app/frontend\n\
npm start\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Expose ports for Flask and React
EXPOSE 5000 3000

# Set entrypoint
ENTRYPOINT ["/app/start.sh"]
