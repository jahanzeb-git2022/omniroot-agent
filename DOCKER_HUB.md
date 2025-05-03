# Publishing to Docker Hub

This guide explains how to publish the Agentic Software-Development Tool to Docker Hub so users can easily install it without cloning the repository.

## Prerequisites

- Docker account ([Sign up here](https://hub.docker.com/signup))
- Docker CLI installed and logged in

## Steps to Publish

### 1. Build the Docker Image

```bash
cd agentic-dev-tool
docker build -t yourusername/agentic-dev-tool:latest .
```

Replace `yourusername` with your Docker Hub username.

### 2. Test the Image Locally

```bash
docker run -p 3000:3000 -p 5000:5000 -v $HOME:/host_home yourusername/agentic-dev-tool:latest
```

Verify that the application works correctly by accessing http://localhost:3000.

### 3. Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

### 4. Push the Image to Docker Hub

```bash
docker push yourusername/agentic-dev-tool:latest
```

This will upload your image to Docker Hub, making it publicly available.

### 5. Create a Version Tag (Optional but Recommended)

```bash
# Tag the current image with a version number
docker tag yourusername/agentic-dev-tool:latest yourusername/agentic-dev-tool:v1.0.0

# Push the tagged version
docker push yourusername/agentic-dev-tool:v1.0.0
```

### 6. Update Docker Hub Description

Visit your repository on Docker Hub and update the description, providing:
- A brief overview of the tool
- Installation instructions
- Link to your GitHub repository

## Automating Builds (Optional)

You can set up automated builds on Docker Hub to automatically build and publish new versions when you push changes to your GitHub repository:

1. Go to your repository on Docker Hub
2. Click on "Builds" tab
3. Click "Link to GitHub"
4. Select your GitHub repository
5. Configure build settings
6. Save and trigger a build

## Updating the Image

When you make changes to your application:

1. Build a new image:
   ```bash
   docker build -t yourusername/agentic-dev-tool:latest .
   ```

2. Push the updated image:
   ```bash
   docker push yourusername/agentic-dev-tool:latest
   ```

3. Create a new version tag if needed:
   ```bash
   docker tag yourusername/agentic-dev-tool:latest yourusername/agentic-dev-tool:v1.0.1
   docker push yourusername/agentic-dev-tool:v1.0.1
   ```