# Project Structure

The Agentic Software-Development Tool has the following directory structure:

```
agentic_dev_tool/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── agent.py           # LangChain agent configuration
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── code_editor.py     # Tool for reading/writing files
│   │   └── shell.py           # Tool for executing shell commands
│   ├── __init__.py
│   ├── app.py                 # Flask application with API endpoints
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/
│   │   ├── index.html         # HTML template
│   │   └── manifest.json      # Web app manifest
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/
│   │   │   ├── ChatPage.js    # Chat interface
│   │   │   └── CodePage.js    # Code editor interface
│   │   ├── App.js             # Main React component
│   │   ├── index.js           # React entry point
│   │   ├── index.css          # Global styles with Tailwind
│   │   └── reportWebVitals.js # Performance monitoring
│   ├── .env                   # Environment variables for React
│   ├── package.json           # Node.js dependencies
│   ├── postcss.config.js      # PostCSS configuration
│   └── tailwind.config.js     # Tailwind CSS configuration
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose configuration
├── README.md                  # Project overview
├── USAGE.md                   # Detailed usage instructions
├── DOCKER_COMMANDS.md         # Docker command reference
└── PROJECT_STRUCTURE.md       # This file
```

## Key Components

### Backend

- **app.py**: The main Flask application that sets up API endpoints for chat, file operations, and shell commands.
- **api/agent.py**: Configures the LangChain agent with the Qwen3-235B-A22B model from Huggingface.
- **tools/code_editor.py**: Implements the CodeEditor tool for reading and writing files.
- **tools/shell.py**: Implements the Shell tool for executing commands.

### Frontend

- **App.js**: Sets up routing and manages session/workflow state.
- **pages/ChatPage.js**: Provides an interface for interacting with the agent.
- **pages/CodePage.js**: Integrates Monaco Editor for code editing.

### Docker Configuration

- **Dockerfile**: Sets up the container with Node.js and Python.
- **docker-compose.yml**: Configures the service, mounts the home directory, and sets environment variables.

## Data Flow

1. User interacts with the frontend (React)
2. Frontend sends requests to the backend (Flask)
3. Backend processes requests using the LangChain agent
4. Agent uses tools to perform actions (read/write files, execute commands)
5. Results are returned to the frontend and displayed to the user

## Persistent Storage

- User's home directory is mounted at `/host_home` in the container
- Agent history is stored in `~/.agent_history/history.txt`
