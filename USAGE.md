# Agentic Software-Development Tool: Usage Guide

This document provides detailed instructions on how to use the Agentic Software-Development Tool effectively.

## Getting Started

### Building and Running the Container

1. Clone the repository to your local machine
2. Navigate to the project directory
3. Build and start the container:

```bash
# Build and start the container in detached mode
docker-compose up -d

# View logs if needed
docker-compose logs -f
```

4. Access the web interface at http://localhost:3000

### Stopping the Container

```bash
# Stop the container
docker-compose down
```

## Using the Chat Interface

The Chat interface is your primary way to interact with the AI agent. Here's how to use it effectively:

1. **Start a New Session**: When you first open the application, a new session is automatically created.
2. **Start a New Workflow**: Click the "New Workflow" button to start a fresh workflow within your session.
3. **Send Messages**: Type your requests in the chat input and press Enter or click Send.
4. **View Responses**: The agent will respond with its thoughts, actions, and results.

### Example Requests

Here are some example requests you can make:

- "Create a Python script that calculates the Fibonacci sequence"
- "Find all JavaScript files in my home directory"
- "Write a unit test for my user authentication function"
- "Help me debug this error in my code: [paste error]"
- "Create a React component for a login form"

## Using the Code Editor

The Code Editor interface allows you to directly edit files in your filesystem:

1. **Open a File**: Enter the file path in the input field and click "Load"
2. **Edit the File**: Make changes in the Monaco editor
3. **Save Changes**: Click the "Save" button to write changes to disk
4. **Recent Files**: Click on a file in the "Recent Files" section to quickly open it again

## Understanding the Agent's Workflow

The agent follows a structured workflow:

1. **Thought**: The agent explains its reasoning process
2. **Action**: The agent selects a tool (CodeEditor or Shell) to use
3. **Action Input**: The agent provides input to the tool
4. **Observation**: The agent receives and processes the tool's output
5. **Final Answer**: The agent provides a conclusion or result

## Tool Capabilities

### CodeEditor Tool

The CodeEditor tool can:

- Read files from your filesystem
- Write/create files in your filesystem
- Handle both absolute and relative paths

Example usage in the agent's workflow:

```
Action: CodeEditor
Action Input: {"action":"write","file_path":"hello.py","content":"print('Hello, world!')"}
```

### Shell Tool

The Shell tool can:

- Execute any bash command in the container environment
- Access your entire home directory through the /host_home mount
- Run programs, search for files, and manage your filesystem

Example usage in the agent's workflow:

```
Action: Shell
Action Input: find /host_home -name "*.js" | grep "component"
```

## Persistent Memory

The agent maintains memory across sessions:

- All conversations are stored in `~/.agent_history/history.txt`
- The agent can reference previous interactions
- Sessions, workflows, and steps are tracked for organization

## Troubleshooting

If you encounter issues:

1. **Container Won't Start**: Check Docker logs with `docker-compose logs`
2. **Agent Not Responding**: Refresh the page or restart the container
3. **File Access Issues**: Ensure the container has proper permissions to your home directory
4. **Model API Issues**: Check your Huggingface API token and internet connection

## Advanced Usage

### Customizing the Model

You can use a different Huggingface model by modifying the `agent.py` file:

```python
llm = HuggingFaceHub(
    repo_id="your-preferred-model",
    huggingfacehub_api_token=os.environ.get("HUGGINGFACEHUB_API_TOKEN", "your_default_token"),
    model_kwargs={
        "temperature": 0.2,
        "max_length": 4096,
        "top_p": 0.9
    }
)
```

### Adding Custom Tools

You can extend the agent's capabilities by adding custom tools:

1. Create a new tool class in the `backend/tools` directory
2. Register the tool in `backend/app.py`
3. Update the agent's prompt in `backend/api/agent.py` to include examples of using the new tool