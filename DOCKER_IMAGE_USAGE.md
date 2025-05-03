# Using the Pre-built Docker Image

This guide explains how to use the pre-built Docker image for the Agentic Software-Development Tool.

## Installation Options

### Option 1: One-Line Installer (Recommended)

The easiest way to get started is to use our one-line installer:

```bash
curl -sSL https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/install.sh | bash
```

This script will:
1. Check if Docker and Docker Compose are installed
2. Create a directory for the application
3. Download the necessary configuration
4. Optionally set up your Huggingface API token
5. Pull the Docker image and start the container

### Option 2: Manual Installation

If you prefer to install manually:

1. Create a directory for the application:
   ```bash
   mkdir -p ~/agentic-dev-tool
   cd ~/agentic-dev-tool
   ```

2. Download the docker-compose.yml file:
   ```bash
   curl -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/docker-compose.user.yml
   mv docker-compose.user.yml docker-compose.yml
   ```

3. Pull the Docker image and start the container:
   ```bash
   docker-compose up -d
   ```

## Managing the Application

### Starting the Application

If the application is not running, you can start it with:

```bash
cd ~/agentic-dev-tool
docker-compose up -d
```

### Stopping the Application

To stop the application:

```bash
cd ~/agentic-dev-tool
docker-compose down
```

### Viewing Logs

To view the application logs:

```bash
cd ~/agentic-dev-tool
docker-compose logs
```

To follow the logs in real-time:

```bash
docker-compose logs -f
```

### Updating to the Latest Version

To update to the latest version of the application:

```bash
cd ~/agentic-dev-tool
docker-compose pull
docker-compose up -d
```

## Customization

### Using Your Own Huggingface API Token

You can set your own Huggingface API token by adding it to your environment:

```bash
export HUGGINGFACEHUB_API_TOKEN=your_token_here
cd ~/agentic-dev-tool
docker-compose up -d
```

To make this persistent, add the export command to your shell profile (~/.bashrc, ~/.zshrc, etc.).

### Changing the Ports

If you need to use different ports, edit the docker-compose.yml file:

```yaml
ports:
  - "8080:3000"  # Change 3000 to your preferred frontend port
  - "8081:5000"  # Change 5000 to your preferred backend port
```

Then restart the container:

```bash
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

If the container fails to start, check the logs:

```bash
docker-compose logs
```

Common issues include:
- Port conflicts (another application is using port 3000 or 5000)
- Insufficient permissions to mount the home directory
- Docker daemon not running

### Application Not Accessible

If you can't access the application at http://localhost:3000:

1. Check if the container is running:
   ```bash
   docker-compose ps
   ```

2. Check if the ports are correctly mapped:
   ```bash
   docker-compose port agentic-dev-tool 3000
   ```

3. Try accessing with the IP address instead of localhost:
   ```bash
   docker-compose port agentic-dev-tool 3000 | sed 's/0.0.0.0/127.0.0.1/'
   ```

### Reset the Application

If you want to reset the application state:

```bash
# Stop the container
docker-compose down

# Remove the history directory
rm -rf ~/.agent_history

# Start the container again
docker-compose up -d
```

## Uninstalling

To completely remove the application:

```bash
# Stop and remove the container
cd ~/agentic-dev-tool
docker-compose down

# Remove the Docker image
docker rmi yourusername/agentic-dev-tool:latest

# Remove the application directory
cd ~
rm -rf ~/agentic-dev-tool

# Optionally, remove the history directory
rm -rf ~/.agent_history
```