# Use Node.js as base image
FROM node:18-slim

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    bash \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create sandbox directory for mounted files
RUN mkdir -p /sandbox/code

# Copy backend requirements and install dependencies
COPY backend/requirements.txt /app/backend/
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy frontend package.json and install dependencies
COPY frontend/package.json frontend/package-lock.json* /app/frontend/
WORKDIR /app/frontend
RUN npm install

# Copy frontend code
COPY frontend/ /app/frontend/

# Build frontend
RUN npm run build

# Create directory for agent history
RUN mkdir -p /host_home/.agent_history

# Set working directory back to app root
WORKDIR /app

# Create startup script
RUN echo '#!/bin/bash\n\
# Create history directory if it doesn\'t exist\n\
mkdir -p /host_home/.agent_history\n\
\n\
# Set Huggingface API token if not provided\n\
export HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN:-"your_huggingface_token_here"}\n\
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