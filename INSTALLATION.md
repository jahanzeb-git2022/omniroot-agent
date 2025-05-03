# Agentic Software-Development Tool - Easy Installation Guide

This guide will help you quickly install and run the Agentic Software-Development Tool using our pre-built Docker image. No need to clone the entire repository or build anything!

## Prerequisites

- Docker ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose ([Installation guide](https://docs.docker.com/compose/install/))

## Quick Installation

### Option 1: Using the Installation Script (Recommended)

#### For macOS/Linux:

1. Download the installation files:
   ```bash
   curl -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/docker-compose.simple.yml
   curl -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/easy-start.sh
   chmod +x easy-start.sh
   ```

2. Run the start script:
   ```bash
   ./easy-start.sh
   ```

#### For Windows:

1. Download these two files:
   - [docker-compose.simple.yml](https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/docker-compose.simple.yml)
   - [easy-start.bat](https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/easy-start.bat)

2. Double-click on `easy-start.bat` to run it

### Option 2: Manual Installation

1. Create a new directory for the application:
   ```bash
   mkdir agentic-dev-tool
   cd agentic-dev-tool
   ```

2. Create a file named `docker-compose.yml` with the following content:
   ```yaml
   version: '3.8'

   services:
     agentic-dev-tool:
       image: yourusername/agentic-dev-tool:latest
       ports:
         - "3000:3000"  # React frontend
         - "5000:5000"  # Flask backend
       volumes:
         - ${HOME}:/host_home  # Mount user's home directory
       environment:
         - HUGGINGFACEHUB_API_TOKEN=${HUGGINGFACEHUB_API_TOKEN:-your_huggingface_token_here}
       restart: unless-stopped
   ```

3. Pull and start the container:
   ```bash
   docker-compose up -d
   ```

## Accessing the Application

Once the container is running, open your web browser and go to:
```
http://localhost:3000
```

## Stopping the Application

To stop the application:
```bash
docker-compose down
```

## Updating to the Latest Version

To update to the latest version:
```bash
docker pull yourusername/agentic-dev-tool:latest
docker-compose down
docker-compose up -d
```

## Customization (Optional)

### Using Your Own Huggingface API Token

If you want to use your own Huggingface API token:

```bash
export HUGGINGFACEHUB_API_TOKEN=your_token_here
docker-compose up -d
```

## Troubleshooting

If you encounter any issues:

1. Make sure Docker is running
2. Check that ports 3000 and 5000 are not in use by other applications
3. Try restarting Docker
4. Check the logs with `docker-compose logs -f`

For more help, visit our [GitHub repository](https://github.com/yourusername/agentic-dev-tool).