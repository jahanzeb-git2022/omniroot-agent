"""
Main Flask application for the Agentic Software-Development tool.
This file sets up the Flask server and API endpoints.
"""
import os
import json
import logging
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.api.agent import create_agent
from backend.tools.code_editor import CodeEditorTool
from backend.tools.shell import ShellTool
from backend.memory_manager import EnhancedMemoryManager
from backend.api.llm_manager import DEFAULT_CONFIGS

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'logs.txt')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create required directories
os.makedirs('/sandbox/code', exist_ok=True)
os.makedirs('/host_home/.agent_history', exist_ok=True)

# Ensure environment variables are properly set
if 'HUGGINGFACEHUB_API_TOKEN' in os.environ and not os.environ.get('HUGGINGFACE_API_KEY'):
    os.environ['HUGGINGFACE_API_KEY'] = os.environ.get('HUGGINGFACEHUB_API_TOKEN')
    logger.info("Set HUGGINGFACE_API_KEY from HUGGINGFACEHUB_API_TOKEN")

logger.info(f"HUGGINGFACE_API_KEY is {'set' if os.environ.get('HUGGINGFACE_API_KEY') else 'not set'}")
logger.info(f"OPENAI_API_KEY is {'set' if os.environ.get('OPENAI_API_KEY') else 'not set'}")
logger.info(f"ANTHROPIC_API_KEY is {'set' if os.environ.get('ANTHROPIC_API_KEY') else 'not set'}")
logger.info(f"GOOGLE_API_KEY is {'set' if os.environ.get('GOOGLE_API_KEY') else 'not set'}")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Store the current LLM configuration
current_llm_config = DEFAULT_CONFIGS["huggingface"].copy()
logger.info(f"Using default LLM config: {current_llm_config['provider']}/{current_llm_config['model_name']}")

try:
    # Initialize enhanced memory manager
    memory_manager = EnhancedMemoryManager(
        history_path="/host_home/.agent_history",
        max_buffer_workflows=5,
        llm_config=current_llm_config
    )
    logger.info("Memory manager initialized successfully")

    # Initialize tools
    code_editor_tool = CodeEditorTool()
    shell_tool = ShellTool()
    logger.info("Tools initialized successfully")

    # Initialize agent with tools and memory
    # We'll update the memory when a session/workflow is selected
    agent = create_agent(
        tools=[code_editor_tool, shell_tool],
        memory=memory_manager.get_memory_for_llm(),
        llm_config=current_llm_config
    )
    logger.info("Agent initialized successfully")
except Exception as e:
    logger.error(f"Error during initialization: {str(e)}", exc_info=True)
    raise

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    API endpoint for chat interactions with the agent.
    Expects: {"message": str, "session_id": str, "step_id": int}
    Returns: {"response": str, "workflow_id": str}
    
    Note: Each new task (first message in a conversation) creates a new workflow.
    Subsequent messages continue in the same workflow.
    """
    try:
        from uuid import uuid4
        
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', 'default_session')
        step_id = data.get('step_id', 0)
        
        # Check if this is a continuation of an existing workflow or a new task
        workflow_id = data.get('workflow_id')
        is_new_task = step_id == 0 or not workflow_id
        
        if is_new_task:
            # Create a new workflow for this task
            workflow_id = str(uuid4())
            workflow_name = f"Task: {message[:50]}..." if len(message) > 50 else f"Task: {message}"
            logger.info(f"Creating new workflow for task: {workflow_id} - {workflow_name}")
        else:
            workflow_name = data.get('workflow_name')
            logger.info(f"Continuing workflow: {workflow_id}, step={step_id}")
        
        logger.info(f"Chat request: session={session_id}, workflow={workflow_id}, step={step_id}")
        
        # Start or continue session and workflow
        memory_manager.start_session(session_id)
        memory_manager.start_workflow(workflow_id, workflow_name, task=message if is_new_task else None)
        
        # Update agent with current workflow memory
        agent.memory = memory_manager.get_memory_for_llm(workflow_id)
        
        # Add metadata to the message
        message_with_metadata = f"{message}\n[Metadata: session_id={session_id}, workflow_id={workflow_id}, step_id={step_id}]"
        
        # Get response from agent
        logger.info(f"Running agent with message: {message[:50]}...")
        response = agent.run(message_with_metadata)
        
        # Save interaction to memory manager
        memory_manager.add_interaction(message, response, step_id)
        
        logger.info(f"Chat response generated: {len(response)} chars")
        return jsonify({
            "response": response,
            "workflow_id": workflow_id
        })
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e), 
            "response": "I encountered an error processing your request. Please try again.",
            "workflow_id": data.get('workflow_id', 'error_workflow')
        }), 500

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """
    API endpoint to get all sessions for the history UI.
    Returns: {"sessions": [session data]}
    """
    try:
        logger.info("Getting all sessions")
        sessions = memory_manager.get_all_sessions()
        return jsonify({"sessions": sessions})
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "sessions": []}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """
    API endpoint to get a specific session.
    Returns: {session data}
    """
    try:
        logger.info(f"Getting session: {session_id}")
        session = memory_manager.get_session(session_id)
        if session:
            return jsonify(session)
        logger.warning(f"Session not found: {session_id}")
        return jsonify({"error": "Session not found"}), 404
    except Exception as e:
        logger.error(f"Error getting session {session_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflow/<session_id>/<workflow_id>', methods=['GET'])
def get_workflow(session_id, workflow_id):
    """
    API endpoint to get a specific workflow.
    Returns: {workflow data}
    """
    try:
        logger.info(f"Getting workflow: {session_id}/{workflow_id}")
        workflow = memory_manager.get_workflow(session_id, workflow_id)
        if workflow:
            return jsonify(workflow)
        logger.warning(f"Workflow not found: {session_id}/{workflow_id}")
        return jsonify({"error": "Workflow not found"}), 404
    except Exception as e:
        logger.error(f"Error getting workflow {session_id}/{workflow_id}: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/model/config', methods=['GET'])
def get_model_config():
    """
    API endpoint to get the current model configuration.
    Returns: {"provider": str, "model_name": str, "model_kwargs": dict}
    """
    try:
        logger.info("Getting model configuration")
        # Don't return the API key
        config = current_llm_config.copy()
        config.pop("api_key", None)
        return jsonify(config)
    except Exception as e:
        logger.error(f"Error getting model config: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/model/config', methods=['POST'])
def update_model_config():
    """
    API endpoint to update the model configuration.
    Expects: {"provider": str, "model_name": str, "api_key": str, "model_kwargs": dict}
    Returns: {"status": "success"|"error", "message": str}
    """
    global current_llm_config, agent, memory_manager
    
    try:
        data = request.json
        logger.info(f"Updating model config to {data.get('provider')}/{data.get('model_name')}")
        
        # Update the configuration
        current_llm_config.update({
            "provider": data.get("provider", current_llm_config["provider"]),
            "model_name": data.get("model_name", current_llm_config["model_name"]),
            "model_kwargs": data.get("model_kwargs", current_llm_config["model_kwargs"])
        })
        
        # Only update API key if provided
        if "api_key" in data and data["api_key"]:
            current_llm_config["api_key"] = data["api_key"]
            logger.info(f"Updated API key for {current_llm_config['provider']}")
        
        # Reinitialize the agent with the new configuration
        agent = create_agent(
            tools=[code_editor_tool, shell_tool],
            memory=memory_manager.get_memory_for_llm(),
            llm_config=current_llm_config
        )
        logger.info("Agent reinitialized with new configuration")
        
        # Update memory manager's LLM
        memory_manager = EnhancedMemoryManager(
            history_path="/host_home/.agent_history",
            max_buffer_workflows=5,
            llm_config=current_llm_config
        )
        logger.info("Memory manager updated with new configuration")
        
        return jsonify({
            "status": "success",
            "message": f"Model updated to {current_llm_config['provider']}/{current_llm_config['model_name']}"
        })
    except Exception as e:
        logger.error(f"Error updating model config: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Error updating model: {str(e)}"
        }), 400

@app.route('/api/model/providers', methods=['GET'])
def get_model_providers():
    """
    API endpoint to get available model providers and their models.
    Returns: {"providers": [{"name": str, "models": [str]}]}
    """
    try:
        logger.info("Getting model providers")
        providers = [
            {
                "name": "huggingface",
                "display_name": "Hugging Face",
                "models": [
                    "Qwen/Qwen3-235B-A22B",
                    "meta-llama/Llama-2-70b-chat-hf",
                    "mistralai/Mistral-7B-Instruct-v0.2",
                    "google/gemma-7b-it"
                ]
            },
            {
                "name": "openai",
                "display_name": "OpenAI",
                "models": [
                    "gpt-3.5-turbo",
                    "gpt-4",
                    "gpt-4-turbo"
                ]
            },
            {
                "name": "anthropic",
                "display_name": "Anthropic",
                "models": [
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307"
                ]
            },
            {
                "name": "google",
                "display_name": "Google",
                "models": [
                    "gemini-pro",
                    "gemini-ultra"
                ]
            }
        ]
        
        return jsonify({"providers": providers})
    except Exception as e:
        logger.error(f"Error getting model providers: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "providers": []}), 500

@app.route('/api/read_file', methods=['GET'])
def read_file():
    """
    API endpoint to read a file.
    Expects: query parameters "file_path", "session_id", "workflow_id"
    Returns: {"content": str, "status": "success"|"error", "message": str}
    """
    try:
        file_path = request.args.get('file_path', '')
        session_id = request.args.get('session_id', 'default_session')
        workflow_id = request.args.get('workflow_id', '')
        
        logger.info(f"Reading file: {file_path} (session={session_id}, workflow={workflow_id})")
        
        # Ensure the path is within the mounted directory
        if not file_path.startswith('/sandbox/code/'):
            file_path = os.path.join('/sandbox/code', file_path.lstrip('/'))
        
        # Create directory if it doesn't exist
        os.makedirs('/sandbox/code', exist_ok=True)
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Start or continue session and workflow if provided
        if session_id and workflow_id:
            memory_manager.start_session(session_id)
            memory_manager.start_workflow(workflow_id)
            
            # Update agent with current workflow memory
            agent.memory = memory_manager.get_memory_for_llm(workflow_id)
            
            # Add file read to memory if the file is not too large
            if len(content) <= 1000:
                # Format the file read as a message for the memory
                read_msg = f"User read file: {file_path}"
                result_msg = f"File content:\n```\n{content}\n```"
                
                # Add to memory manager
                memory_manager.add_interaction(read_msg, result_msg)
            else:
                # For large files, just note that it was read
                read_msg = f"User read file: {file_path} ({len(content)} bytes)"
                result_msg = f"File read successfully."
                
                # Add to memory manager
                memory_manager.add_interaction(read_msg, result_msg)
        
        logger.info(f"File read successfully: {file_path} ({len(content)} bytes)")
        return jsonify({
            "status": "success",
            "content": content,
            "message": f"File {file_path} read successfully"
        })
    except FileNotFoundError:
        logger.warning(f"File not found: {file_path}")
        return jsonify({
            "status": "error",
            "content": "",
            "message": f"File not found: {file_path}"
        }), 404
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "content": "",
            "message": f"Error reading file: {str(e)}"
        }), 400

@app.route('/api/edit_file', methods=['POST'])
def edit_file():
    """
    API endpoint to edit a file.
    Expects: {"file_path": str, "content": str, "session_id": str, "workflow_id": str}
    Returns: {"status": "success"|"error", "message": str}
    """
    try:
        data = request.json
        file_path = data.get('file_path', '')
        content = data.get('content', '')
        session_id = data.get('session_id', 'default_session')
        workflow_id = data.get('workflow_id')
        
        logger.info(f"Editing file: {file_path} ({len(content)} bytes) (session={session_id}, workflow={workflow_id})")
        
        # Ensure the path is within the mounted directory
        if not file_path.startswith('/sandbox/code/'):
            file_path = os.path.join('/sandbox/code', file_path.lstrip('/'))
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Check if file exists to determine if this is a create or update operation
        is_new_file = not os.path.exists(file_path)
        
        # Read old content if file exists
        old_content = ""
        if not is_new_file:
            try:
                with open(file_path, 'r') as f:
                    old_content = f.read()
            except Exception as e:
                logger.warning(f"Could not read old content of {file_path}: {str(e)}")
        
        # Write new content
        with open(file_path, 'w') as f:
            f.write(content)
        
        # Start or continue session and workflow if provided
        if session_id and workflow_id:
            memory_manager.start_session(session_id)
            memory_manager.start_workflow(workflow_id)
            
            # Update agent with current workflow memory
            agent.memory = memory_manager.get_memory_for_llm(workflow_id)
            
            # Add file edit to memory
            operation = "Created" if is_new_file else "Updated"
            
            # Format the file edit as a message for the memory
            if len(content) > 1000:
                # For large files, just note that it was edited
                edit_msg = f"User {operation.lower()} file: {file_path} ({len(content)} bytes)"
            else:
                # For smaller files, include the content
                edit_msg = f"User {operation.lower()} file: {file_path} with content:\n```\n{content}\n```"
            
            result_msg = f"File {operation.lower()} successfully."
            
            # Add to memory manager
            memory_manager.add_interaction(edit_msg, result_msg)
        
        logger.info(f"File updated successfully: {file_path}")
        return jsonify({
            "status": "success",
            "message": f"File {file_path} updated successfully"
        })
    except Exception as e:
        logger.error(f"Error updating file {file_path}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Error updating file: {str(e)}"
        }), 400

@app.route('/api/shell', methods=['POST'])
def execute_shell():
    """
    API endpoint to execute shell commands.
    Expects: {"command": str, "session_id": str, "workflow_id": str}
    Returns: {"exit_code": int, "stdout": str, "stderr": str}
    """
    try:
        data = request.json
        command = data.get('command', '')
        session_id = data.get('session_id', 'default_session')
        workflow_id = data.get('workflow_id')
        
        logger.info(f"Executing shell command: {command} (session={session_id}, workflow={workflow_id})")
        
        # Create sandbox directory if it doesn't exist
        os.makedirs('/sandbox/code', exist_ok=True)
        
        # Start or continue session and workflow if provided
        if session_id and workflow_id:
            memory_manager.start_session(session_id)
            memory_manager.start_workflow(workflow_id)
            
            # Update agent with current workflow memory
            agent.memory = memory_manager.get_memory_for_llm(workflow_id)
        
        result = shell_tool.run(command)
        
        try:
            result_dict = json.loads(result)
            exit_code = result_dict.get('exit_code', 1)
            stdout = result_dict.get('stdout', '')
            stderr = result_dict.get('stderr', '')
            
            logger.info(f"Command executed with exit code: {exit_code}")
            
            # Add command execution to memory if workflow is active
            if session_id and workflow_id:
                # Format the command execution as a message for the memory
                command_msg = f"User executed command: {command}"
                result_msg = f"Command result (exit code {exit_code}):\n"
                if stdout:
                    result_msg += f"STDOUT:\n{stdout}\n"
                if stderr:
                    result_msg += f"STDERR:\n{stderr}\n"
                
                # Add to memory manager
                memory_manager.add_interaction(command_msg, result_msg)
            
            return jsonify(result_dict)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing shell result: {str(e)}", exc_info=True)
            return jsonify({
                "exit_code": 1,
                "stdout": "",
                "stderr": f"Error parsing result: {result}"
            }), 400
    except Exception as e:
        logger.error(f"Error executing shell command: {str(e)}", exc_info=True)
        return jsonify({
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Error executing command: {str(e)}"
        }), 500

# Add a health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """
    API endpoint to check if the backend is running.
    Returns: {"status": "ok", "version": "1.0.0"}
    """
    try:
        return jsonify({
            "status": "ok",
            "version": "1.0.0",
            "environment": {
                "huggingface_api_key": "set" if os.environ.get('HUGGINGFACE_API_KEY') else "not set",
                "openai_api_key": "set" if os.environ.get('OPENAI_API_KEY') else "not set",
                "anthropic_api_key": "set" if os.environ.get('ANTHROPIC_API_KEY') else "not set",
                "google_api_key": "set" if os.environ.get('GOOGLE_API_KEY') else "not set"
            }
        })
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application on 0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)