"""
Main Flask application for the Agentic Software-Development tool.
This file sets up the Flask server and API endpoints.
"""
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.api.agent import create_agent
from backend.tools.code_editor import CodeEditorTool
from backend.tools.shell import ShellTool
from backend.memory_manager import EnhancedMemoryManager
from backend.api.llm_manager import DEFAULT_CONFIGS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Store the current LLM configuration
current_llm_config = DEFAULT_CONFIGS["huggingface"].copy()

# Initialize enhanced memory manager
memory_manager = EnhancedMemoryManager(
    history_path="/host_home/.agent_history",
    max_buffer_workflows=5,
    llm_config=current_llm_config
)

# Initialize tools
code_editor_tool = CodeEditorTool()
shell_tool = ShellTool()

# Initialize agent with tools and memory
# We'll update the memory when a session/workflow is selected
agent = create_agent(
    tools=[code_editor_tool, shell_tool],
    memory=memory_manager.get_memory_for_llm(),
    llm_config=current_llm_config
)

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    API endpoint for chat interactions with the agent.
    Expects: {"message": str, "session_id": str, "workflow_id": str, "step_id": int}
    Returns: {"response": str}
    """
    data = request.json
    message = data.get('message', '')
    session_id = data.get('session_id', 'default_session')
    workflow_id = data.get('workflow_id', 'default_workflow')
    step_id = data.get('step_id', 0)
    workflow_name = data.get('workflow_name', None)
    
    # Start or continue session and workflow
    memory_manager.start_session(session_id)
    memory_manager.start_workflow(workflow_id, workflow_name)
    
    # Update agent with current memory
    agent.memory = memory_manager.get_memory_for_llm()
    
    # Add metadata to the message
    message_with_metadata = f"{message}\n[Metadata: session_id={session_id}, workflow_id={workflow_id}, step_id={step_id}]"
    
    # Get response from agent
    response = agent.run(message_with_metadata)
    
    # Save interaction to memory manager
    memory_manager.add_interaction(message, response, step_id)
    
    return jsonify({"response": response})

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """
    API endpoint to get all sessions for the history UI.
    Returns: {"sessions": [session data]}
    """
    sessions = memory_manager.get_all_sessions()
    return jsonify({"sessions": sessions})

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """
    API endpoint to get a specific session.
    Returns: {session data}
    """
    session = memory_manager.get_session(session_id)
    if session:
        return jsonify(session)
    return jsonify({"error": "Session not found"}), 404

@app.route('/api/workflow/<session_id>/<workflow_id>', methods=['GET'])
def get_workflow(session_id, workflow_id):
    """
    API endpoint to get a specific workflow.
    Returns: {workflow data}
    """
    workflow = memory_manager.get_workflow(session_id, workflow_id)
    if workflow:
        return jsonify(workflow)
    return jsonify({"error": "Workflow not found"}), 404

@app.route('/api/model/config', methods=['GET'])
def get_model_config():
    """
    API endpoint to get the current model configuration.
    Returns: {"provider": str, "model_name": str, "model_kwargs": dict}
    """
    # Don't return the API key
    config = current_llm_config.copy()
    config.pop("api_key", None)
    return jsonify(config)

@app.route('/api/model/config', methods=['POST'])
def update_model_config():
    """
    API endpoint to update the model configuration.
    Expects: {"provider": str, "model_name": str, "api_key": str, "model_kwargs": dict}
    Returns: {"status": "success"|"error", "message": str}
    """
    global current_llm_config, agent, memory_manager
    
    data = request.json
    
    # Update the configuration
    current_llm_config.update({
        "provider": data.get("provider", current_llm_config["provider"]),
        "model_name": data.get("model_name", current_llm_config["model_name"]),
        "model_kwargs": data.get("model_kwargs", current_llm_config["model_kwargs"])
    })
    
    # Only update API key if provided
    if "api_key" in data and data["api_key"]:
        current_llm_config["api_key"] = data["api_key"]
    
    try:
        # Reinitialize the agent with the new configuration
        agent = create_agent(
            tools=[code_editor_tool, shell_tool],
            memory=memory_manager.get_memory_for_llm(),
            llm_config=current_llm_config
        )
        
        # Update memory manager's LLM
        memory_manager = EnhancedMemoryManager(
            history_path="/host_home/.agent_history",
            max_buffer_workflows=5,
            llm_config=current_llm_config
        )
        
        return jsonify({
            "status": "success",
            "message": f"Model updated to {current_llm_config['provider']}/{current_llm_config['model_name']}"
        })
    except Exception as e:
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

@app.route('/api/read_file', methods=['GET'])
def read_file():
    """
    API endpoint to read a file.
    Expects: query parameter "file_path"
    Returns: {"content": str, "status": "success"|"error", "message": str}
    """
    file_path = request.args.get('file_path', '')
    
    # Ensure the path is within the mounted directory
    if not file_path.startswith('/sandbox/code/'):
        file_path = os.path.join('/sandbox/code', file_path.lstrip('/'))
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        return jsonify({
            "status": "success",
            "content": content,
            "message": f"File {file_path} read successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "content": "",
            "message": f"Error reading file: {str(e)}"
        }), 400

@app.route('/api/edit_file', methods=['POST'])
def edit_file():
    """
    API endpoint to edit a file.
    Expects: {"file_path": str, "content": str}
    Returns: {"status": "success"|"error", "message": str}
    """
    data = request.json
    file_path = data.get('file_path', '')
    content = data.get('content', '')
    
    # Ensure the path is within the mounted directory
    if not file_path.startswith('/sandbox/code/'):
        file_path = os.path.join('/sandbox/code', file_path.lstrip('/'))
    
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        return jsonify({
            "status": "success",
            "message": f"File {file_path} updated successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error updating file: {str(e)}"
        }), 400

@app.route('/api/shell', methods=['POST'])
def execute_shell():
    """
    API endpoint to execute shell commands.
    Expects: {"command": str}
    Returns: {"exit_code": int, "stdout": str, "stderr": str}
    """
    data = request.json
    command = data.get('command', '')
    
    result = shell_tool.run(command)
    
    try:
        result_dict = json.loads(result)
        return jsonify(result_dict)
    except:
        return jsonify({
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Error parsing result: {result}"
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)