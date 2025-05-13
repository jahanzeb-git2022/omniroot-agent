# Backend Fixes for omniroot-agent

This document outlines the fixes made to the backend of the omniroot-agent application to address various issues.

## Issues Fixed

1. **Environment Variable Inconsistency**
   - Fixed inconsistency between `HUGGINGFACEHUB_API_TOKEN` and `HUGGINGFACE_API_KEY`
   - Now both environment variables are supported and synchronized

2. **Error Handling and Logging**
   - Added comprehensive error handling to all API endpoints
   - Implemented proper logging to file and console
   - Created a dedicated log directory at `/app/backend/logs`

3. **Directory Permissions**
   - Added code to ensure required directories exist and have proper permissions
   - Fixed permission issues with `/sandbox/code` and `/host_home/.agent_history`

4. **Startup Script**
   - Enhanced the Docker startup script with better error handling
   - Added checks to verify the backend starts successfully
   - Improved environment variable handling

5. **Health Check Endpoint**
   - Added a new `/api/health` endpoint to check backend status
   - Provides information about environment variables and version

6. **Docker Configuration**
   - Updated docker-compose.yml to handle environment variables properly
   - Ensured both environment variable names are passed to the container

## Testing the Backend

A test script has been created to verify the backend is working correctly:

```bash
# Run the backend directly (for testing)
./run_backend.sh

# In another terminal, run the test script
python test_backend.py
```

## Running the Application

### Using Docker (Recommended)

```bash
# Build and start the container
docker-compose up --build
```

### Running Locally (Development)

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run the backend
./run_backend.sh

# In another terminal, install frontend dependencies
cd frontend
npm install

# Run the frontend
npm start
```

## Troubleshooting

If you encounter issues with the backend:

1. Check the logs at `/app/backend/logs/` or `/workspace/omniroot-agent/backend/logs/`
2. Verify environment variables are set correctly
3. Ensure required directories exist and have proper permissions
4. Test the backend with the test script

## API Endpoints

- `/api/health` - Check backend status
- `/api/chat` - Chat with the agent
- `/api/sessions` - Get all sessions
- `/api/session/<session_id>` - Get a specific session
- `/api/workflow/<session_id>/<workflow_id>` - Get a specific workflow
- `/api/model/config` - Get or update model configuration
- `/api/model/providers` - Get available model providers
- `/api/read_file` - Read a file
- `/api/edit_file` - Edit a file
- `/api/shell` - Execute shell commands