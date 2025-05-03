# Docker Commands for Agentic Software-Development Tool

This document provides the essential Docker commands to build, run, and manage the Agentic Software-Development Tool.

## Building and Running

### Build and Start the Container

```bash
# Navigate to the project directory
cd agentic_dev_tool

# Build and start the container in detached mode
docker-compose up -d
```

### View Container Logs

```bash
# View logs from all services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for a specific service
docker-compose logs agentic-dev-tool
```

### Stop the Container

```bash
# Stop the container but preserve volumes
docker-compose down

# Stop the container and remove volumes
docker-compose down -v
```

## Rebuilding After Changes

```bash
# Rebuild the container after making changes
docker-compose up -d --build
```

## Accessing the Container Shell

```bash
# Access the container's shell
docker-compose exec agentic-dev-tool bash
```

## Managing Container Resources

```bash
# View running containers
docker ps

# View container resource usage
docker stats

# Restart the container
docker-compose restart
```

## Environment Variables

You can set environment variables before starting the container:

```bash
# Set Huggingface API token
export HUGGINGFACEHUB_API_TOKEN=your_token_here

# Then start the container
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check for errors in the logs
docker-compose logs

# Verify Docker daemon is running
docker info

# Check if ports are already in use
sudo lsof -i :3000
sudo lsof -i :5000
```

### Permission Issues

```bash
# Fix permission issues with mounted volumes
sudo chown -R $(id -u):$(id -g) ~/.agent_history
```

### Reset Container State

```bash
# Remove container and rebuild from scratch
docker-compose down
docker-compose up -d --build --force-recreate
```

## Accessing the Application

Once the container is running, access the application at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production Deployment

For production deployment, consider:

```bash
# Build for production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Use a specific network
docker network create agentic_network
docker-compose --network agentic_network up -d
```