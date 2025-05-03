# Implementation Details

This document provides a detailed explanation of how the Agentic Software-Development Tool works and how all the components fit together.

## Architecture Overview

The system is built as a Docker container with two main components:
- A Flask backend that exposes API endpoints and integrates with LangChain
- A React frontend that provides a user interface for chat and code editing

## Backend Components

### Flask App (app.py)

The main entry point that:
- Sets up API endpoints for chat, file operations, and shell commands
- Initializes the LangChain memory and loads existing history
- Handles requests from the frontend and returns responses

Key endpoints:
- `/api/chat`: Processes chat messages and returns agent responses
- `/api/read_file`: Reads files from the filesystem
- `/api/edit_file`: Writes/creates files in the filesystem
- `/api/shell`: Executes shell commands

### Agent Module (api/agent.py)

Configures the LangChain agent with:
- The Qwen3-235B-A22B model from Huggingface
- ConversationBufferMemory for persistent chat history
- Custom prompt with error handling instructions and example workflows

### Tools

#### CodeEditorTool (tools/code_editor.py)

Allows reading and writing files in the mounted filesystem:
- Accepts JSON input with action, file_path, and content
- Returns JSON output with status, message, and content
- Handles both absolute and relative paths
- Creates directories as needed when writing files

#### ShellTool (tools/shell.py)

Executes shell commands in the container environment:
- Accepts a command string as input
- Returns JSON output with exit_code, stdout, and stderr
- Sets working directory to the mounted directory

## Frontend Components

### React App (App.js)

Sets up routing and manages session/workflow state:
- Generates unique session and workflow IDs
- Provides navigation between Chat and Code Editor tabs
- Tracks step IDs for structured workflows

### Chat Page (ChatPage.js)

Provides an interface for interacting with the agent:
- Displays chat messages with user/assistant formatting
- Sends messages to the backend with session metadata
- Shows loading state during agent processing

### Code Editor Page (CodePage.js)

Integrates Monaco Editor for code editing:
- Allows loading files by path
- Provides syntax highlighting based on file extension
- Saves changes back to the filesystem
- Tracks recently opened files

## Memory and Persistence

- Uses LangChain's ConversationBufferMemory to retain chat history
- Stores history in a file at `/host_home/.agent_history/history.txt`
- Preserves session, workflow, and step IDs for structured interactions
- Loads existing history when the container starts

## Docker Configuration

### Dockerfile

Sets up the container with:
- Node.js for the frontend
- Python for the backend
- Required dependencies for both
- A startup script that initializes the environment and starts both services

### docker-compose.yml

Configures the service with:
- Port mappings for frontend (3000) and backend (5000)
- Volume mounting of the user's home directory to `/host_home`
- Environment variables for the Huggingface API token

## Workflow

1. User sends a message through the chat interface
2. Backend processes the message and passes it to the LangChain agent
3. Agent uses tools (CodeEditor, Shell) to perform actions
4. Results are returned to the user and stored in memory
5. The process repeats for each interaction

## Error Handling

The system includes several error handling mechanisms:
- Agent retries failed tool calls up to 2 times
- Backend API endpoints return appropriate error messages
- Frontend displays error states to the user
- Docker container logs errors for debugging

## Security Considerations

- The container has read/write access to the user's home directory
- API endpoints do not require authentication (intended for local use)
- Huggingface API token is stored in environment variables
- Shell commands are executed with the container's permissions

## Performance Optimization

- Frontend uses React's virtual DOM for efficient updates
- Backend uses Gunicorn with multiple workers for handling requests
- Monaco Editor is loaded only when needed
- Docker container uses multi-stage build for smaller image size