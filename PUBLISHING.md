# Publishing the Docker Image

This guide explains how to build and publish the Docker image for the Agentic Software-Development Tool.

## Prerequisites

- Docker account (https://hub.docker.com/)
- Docker CLI logged in to your account

## Building and Publishing the Image

### 1. Log in to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

### 2. Build the Docker Image

Navigate to the project directory and build the image:

```bash
cd agentic_dev_tool
docker build -t yourusername/agentic-dev-tool:latest .
```

Replace `yourusername` with your Docker Hub username.

### 3. Push the Image to Docker Hub

```bash
docker push yourusername/agentic-dev-tool:latest
```

### 4. Tag and Push a Version (Optional but Recommended)

```bash
# Tag with a version number
docker tag yourusername/agentic-dev-tool:latest yourusername/agentic-dev-tool:1.0.0

# Push the tagged version
docker push yourusername/agentic-dev-tool:1.0.0
```

## Automating with GitHub Actions

You can automate this process using GitHub Actions. Create a file at `.github/workflows/docker-publish.yml` with the following content:

```yaml
name: Publish Docker image

on:
  release:
    types: [published]
  push:
    branches: [ main ]
    tags: [ 'v*.*.*' ]

jobs:
  push_to_registry:
    name: Push Docker image to Docker Hub
    runs-on: ubuntu-latest
    steps:
      - name: Check out the repo
        uses: actions/checkout@v3
      
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Extract metadata (tags, labels) for Docker
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: yourusername/agentic-dev-tool
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=ref,event=branch
            type=sha
            latest
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

Remember to add your Docker Hub credentials as secrets in your GitHub repository:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

## Updating the User Documentation

After publishing a new version, update the following files:

1. `README.md`: Update the installation instructions if needed
2. `docker-compose.user.yml`: Update the image version if needed
3. `install.sh`: Update any version references

## Testing the Published Image

Before announcing a new release, test the published image:

```bash
# Create a test directory
mkdir test-agentic-tool
cd test-agentic-tool

# Download the user docker-compose file
curl -O https://raw.githubusercontent.com/yourusername/agentic-dev-tool/main/docker-compose.user.yml

# Start the container
docker-compose -f docker-compose.user.yml up -d

# Check if it's running
docker-compose -f docker-compose.user.yml ps
```

Visit http://localhost:3000 to verify the application is working correctly.