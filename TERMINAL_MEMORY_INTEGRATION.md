# Terminal and Memory Integration

This document describes the changes made to ensure that terminal commands and file operations are properly reflected in the agent's memory and context.

## Key Changes

### 1. Terminal UI Integration

- **Fixed API Endpoint**: Updated the Terminal component to use the correct `/api/shell` endpoint instead of the non-existent `/api/execute` endpoint
- **Enhanced Output Handling**: Improved the display of command output in the terminal UI, properly handling both stdout and stderr
- **Session and Workflow Context**: Added session_id and workflow_id parameters to terminal commands to maintain context

### 2. Memory Integration for Terminal Commands

- **Command Memory**: Updated the `/api/shell` endpoint to store executed commands and their output in the agent's memory
- **Context Preservation**: Ensured that the agent's memory is updated with the current workflow before and after command execution
- **Formatted Command Output**: Added structured formatting for command output in memory to distinguish between stdout and stderr

### 3. Memory Integration for File Operations

- **File Edit Memory**: Updated the `/api/edit_file` endpoint to store file edits in the agent's memory
- **File Read Memory**: Updated the `/api/read_file` endpoint to store file reads in the agent's memory
- **Content Size Handling**: Added special handling for large files to avoid memory bloat while still preserving context
- **Operation Type Detection**: Added detection for file creation vs. update operations

## Implementation Details

### Terminal Component (`Terminal.js`)

- Fixed API endpoint from `/api/execute` to `/api/shell`
- Enhanced output handling to properly display stdout and stderr
- Added session and workflow IDs to API requests

### Backend Shell Endpoint (`app.py`)

- Updated `/api/shell` endpoint to accept session_id and workflow_id parameters
- Added memory integration to store commands and their output
- Enhanced error handling and logging

### File Operation Endpoints (`app.py`)

- Updated `/api/edit_file` endpoint to accept session_id and workflow_id parameters
- Updated `/api/read_file` endpoint to accept session_id and workflow_id parameters
- Added memory integration to store file operations
- Enhanced error handling and logging

## How It Works

1. **Terminal Command Flow**:
   - User enters a command in the terminal
   - Frontend sends command to backend with session and workflow IDs
   - Backend executes command and stores it in memory
   - Output is returned to frontend and displayed in terminal

2. **File Edit Flow**:
   - User edits a file in the code editor
   - Frontend sends file content to backend with session and workflow IDs
   - Backend saves the file and stores the edit operation in memory
   - Success/error message is returned to frontend

3. **File Read Flow**:
   - User opens a file in the code editor
   - Frontend requests file content from backend with session and workflow IDs
   - Backend reads the file and stores the read operation in memory
   - File content is returned to frontend and displayed in editor

## Benefits

- **Improved Context Awareness**: The agent now has full awareness of all terminal commands and file operations
- **Better Continuity**: When starting a new conversation, the previous environment state is preserved in history
- **Enhanced Debugging**: Terminal output is properly displayed and stored, making it easier to debug issues
- **Seamless Integration**: All operations are automatically stored in memory without requiring explicit user actions

## Files Modified

- `/frontend/src/components/Terminal.js`
- `/backend/app.py`