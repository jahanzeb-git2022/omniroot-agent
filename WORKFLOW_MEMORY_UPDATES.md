# Workflow and Memory Management Updates

This document describes the changes made to implement the workflow-per-task model and enhance memory management in the Omniroot Agent application.

## Key Changes

### 1. Workflow-per-Task Model

- **Automatic Workflow Creation**: Each new user task (first message) automatically creates a new workflow
- **Removed Manual Buttons**: Removed the "New Session" and "New Workflow" buttons from the UI
- **Task-Based Naming**: Workflows are now named based on the task content

### 2. Enhanced Memory Management

- **ConversationBufferMemory**: Each workflow has its own buffer memory to maintain context within a task
- **ConversationSummaryMemory**: Completed workflows are summarized and stored for reference in future workflows
- **Workflow Summaries**: Summaries are generated using the LLM and stored in a dedicated file

### 3. Hugging Face API Rate Limiting

- Added a 2-second delay between LLM API calls to avoid rate limiting
- Implemented proper logging for API calls

## Implementation Details

### Backend Changes

1. **Memory Manager (`memory_manager.py`)**:
   - Added workflow-specific buffer memories
   - Implemented workflow summarization
   - Added methods to load and save workflow summaries
   - Enhanced context sharing between workflows

2. **LLM Manager (`llm_manager.py`)**:
   - Added 2-second delay before each API call
   - Enhanced error handling and logging
   - Improved environment variable handling

3. **API Endpoints (`app.py`)**:
   - Updated `/api/chat` endpoint to create new workflows for each task
   - Enhanced workflow metadata storage
   - Improved error handling and logging

### Frontend Changes

1. **App Component (`App.js`)**:
   - Removed "New Session" and "New Workflow" buttons
   - Added automatic workflow ID updating
   - Enhanced session initialization

2. **Chat Page (`ChatPage.js`)**:
   - Updated to work with the workflow-per-task model
   - Added support for updating workflow IDs
   - Improved error handling

3. **History Components**:
   - Updated to display task-based workflow names
   - Enhanced workflow selection logic

## How It Works

1. **New Task Flow**:
   - User enters a message in an empty chat
   - Backend creates a new workflow with a UUID
   - Workflow is named based on the task content
   - Previous workflow summaries are added to the context

2. **Continuing a Task**:
   - User continues conversation in an existing workflow
   - Backend uses the workflow-specific buffer memory
   - Context is maintained within the workflow

3. **Memory Management**:
   - When the number of active workflows exceeds the limit, the oldest workflow is summarized
   - Summaries are generated using the LLM and stored for future reference
   - New workflows receive context from previous workflow summaries

## Configuration

The memory management system can be configured with the following parameters:

- `max_buffer_workflows`: Maximum number of workflows to keep in buffer memory (default: 5)
- `history_path`: Path to store history files (default: "/host_home/.agent_history")

## Files

The following files were modified:

- `/backend/memory_manager.py`
- `/backend/api/llm_manager.py`
- `/backend/app.py`
- `/frontend/src/App.js`
- `/frontend/src/pages/ChatPage.js`

New files created:

- `/workspace/omniroot-agent/WORKFLOW_MEMORY_UPDATES.md` (this document)