# Quick Start Guide

This guide will help you get the Agentic Software-Development Tool up and running quickly.

## Prerequisites

- Docker and Docker Compose installed on your system
- Basic familiarity with terminal commands

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/agentic-dev-tool.git
cd agentic-dev-tool
```

2. Build and start the container:

```bash
docker-compose up -d
```

3. Access the web interface at http://localhost:3000

That's it! You're ready to start using the Agentic Software-Development Tool.

## First Steps

### 1. Try a Simple Code Generation Task

In the Chat tab, type:

```
Create a Python function that calculates the factorial of a number
```

The agent will:
1. Think about how to implement the function
2. Create a Python file with the implementation
3. Test the function to ensure it works correctly

### 2. Explore Your Filesystem

Try asking the agent to find files:

```
Find all Python files in my home directory
```

The agent will use the Shell tool to search your home directory and list the Python files it finds.

### 3. Edit an Existing File

You can use the Code Editor tab to:
1. Enter the path to a file you want to edit
2. Make changes in the editor
3. Save the changes back to disk

### 4. Ask for Help with a Coding Problem

If you're stuck on a coding problem, describe it to the agent:

```
I'm trying to parse a CSV file in Python but I'm getting an IndexError. How can I handle missing values?
```

The agent will provide guidance and can even create example code to demonstrate the solution.

## Next Steps

- Read the full [USAGE.md](USAGE.md) for detailed instructions
- Check [IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md) to understand how the system works
- Refer to [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md) for common Docker operations

## Stopping the Container

When you're done, you can stop the container:

```bash
docker-compose down
```

Your data will be preserved in `~/.agent_history/` for the next session.
