"""
Memory management module for the Agentic Software-Development tool.
This module handles the combination of buffer and summary memory for efficient context management.
"""
import os
import json
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.llms import HuggingFaceHub

class EnhancedMemoryManager:
    """
    Enhanced memory manager that combines buffer memory for recent workflows
    and summary memory for older workflows to optimize token usage.
    """
    
    def __init__(self, history_path="/host_home/.agent_history", max_buffer_workflows=5):
        """
        Initialize the memory manager.
        
        Args:
            history_path (str): Path to store history files
            max_buffer_workflows (int): Maximum number of workflows to keep in buffer memory
        """
        self.history_path = history_path
        self.max_buffer_workflows = max_buffer_workflows
        self.current_session_id = None
        self.current_workflow_id = None
        
        # Create history directory if it doesn't exist
        os.makedirs(history_path, exist_ok=True)
        
        # Initialize memories
        self.buffer_memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Initialize the LLM for summary memory
        self.llm = HuggingFaceHub(
            repo_id="Qwen/Qwen3-235B-A22B",
            huggingfacehub_api_token=os.environ.get("HUGGINGFACEHUB_API_TOKEN", "YOUR_HUGGINGFACE_TOKEN"),
            model_kwargs={"temperature": 0.2, "max_length": 2048}
        )
        
        self.summary_memory = ConversationSummaryMemory(
            llm=self.llm,
            memory_key="chat_history_summary",
            return_messages=True
        )
        
        # Track workflow order
        self.workflow_order = []
        
        # Session data
        self.sessions = {}
    
    def get_session_file(self, session_id):
        """Get the path to a session file."""
        return os.path.join(self.history_path, f"session_{session_id}.json")
    
    def get_workflow_file(self, session_id, workflow_id):
        """Get the path to a workflow file."""
        session_dir = os.path.join(self.history_path, f"session_{session_id}")
        os.makedirs(session_dir, exist_ok=True)
        return os.path.join(session_dir, f"workflow_{workflow_id}.json")
    
    def load_session_index(self):
        """Load the session index file."""
        index_path = os.path.join(self.history_path, "session_index.json")
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r') as f:
                    return json.load(f)
            except:
                return {"sessions": []}
        return {"sessions": []}
    
    def save_session_index(self, index_data):
        """Save the session index file."""
        index_path = os.path.join(self.history_path, "session_index.json")
        with open(index_path, 'w') as f:
            json.dump(index_data, f)
    
    def start_session(self, session_id, session_name=None):
        """
        Start a new session or load an existing one.
        
        Args:
            session_id (str): The session ID
            session_name (str, optional): A human-readable name for the session
        """
        self.current_session_id = session_id
        
        # Update session index
        index = self.load_session_index()
        session_exists = False
        
        for session in index["sessions"]:
            if session["id"] == session_id:
                session_exists = True
                if session_name and not session.get("name"):
                    session["name"] = session_name
                break
        
        if not session_exists:
            index["sessions"].append({
                "id": session_id,
                "name": session_name or f"Session {len(index['sessions']) + 1}",
                "created_at": os.path.getmtime(self.get_session_file(session_id)) if os.path.exists(self.get_session_file(session_id)) else None,
                "workflows": []
            })
            
        self.save_session_index(index)
        
        # Load session data
        session_file = self.get_session_file(session_id)
        if os.path.exists(session_file):
            with open(session_file, 'r') as f:
                self.sessions[session_id] = json.load(f)
        else:
            self.sessions[session_id] = {
                "id": session_id,
                "name": session_name or f"Session {len(index['sessions'])}",
                "workflows": []
            }
    
    def start_workflow(self, workflow_id, workflow_name=None):
        """
        Start a new workflow or continue an existing one.
        
        Args:
            workflow_id (str): The workflow ID
            workflow_name (str, optional): A human-readable name for the workflow
        """
        if not self.current_session_id:
            raise ValueError("No active session. Call start_session first.")
        
        self.current_workflow_id = workflow_id
        
        # Update session data
        session_data = self.sessions.get(self.current_session_id, {"workflows": []})
        
        workflow_exists = False
        for workflow in session_data["workflows"]:
            if workflow["id"] == workflow_id:
                workflow_exists = True
                if workflow_name and not workflow.get("name"):
                    workflow["name"] = workflow_name
                break
        
        if not workflow_exists:
            session_data["workflows"].append({
                "id": workflow_id,
                "name": workflow_name or f"Workflow {len(session_data['workflows']) + 1}",
                "steps": []
            })
            
        self.sessions[self.current_session_id] = session_data
        
        # Save session data
        with open(self.get_session_file(self.current_session_id), 'w') as f:
            json.dump(session_data, f)
        
        # Update workflow order
        if workflow_id in self.workflow_order:
            self.workflow_order.remove(workflow_id)
        self.workflow_order.append(workflow_id)
        
        # If we have more workflows than our buffer limit, summarize the oldest one
        if len(self.workflow_order) > self.max_buffer_workflows:
            oldest_workflow_id = self.workflow_order[0]
            self._summarize_workflow(oldest_workflow_id)
            self.workflow_order.pop(0)
    
    def _summarize_workflow(self, workflow_id):
        """
        Summarize a workflow and move it from buffer to summary memory.
        
        Args:
            workflow_id (str): The workflow ID to summarize
        """
        # This would extract the relevant messages for this workflow from buffer memory
        # and create a summary to store in summary memory
        # For simplicity, we're not implementing the full extraction logic here
        workflow_file = self.get_workflow_file(self.current_session_id, workflow_id)
        
        if os.path.exists(workflow_file):
            with open(workflow_file, 'r') as f:
                workflow_data = json.load(f)
                
            # Create a summary of the workflow
            messages = []
            for step in workflow_data.get("steps", []):
                if "human" in step:
                    messages.append(f"User: {step['human']}")
                if "ai" in step:
                    messages.append(f"Assistant: {step['ai']}")
            
            workflow_text = "\n".join(messages)
            
            # Add to summary memory
            self.summary_memory.save_context(
                {"input": f"Workflow {workflow_id} history"},
                {"output": workflow_text}
            )
    
    def add_interaction(self, human_message, ai_message, step_id):
        """
        Add a human-AI interaction to the current workflow.
        
        Args:
            human_message (str): The user's message
            ai_message (str): The assistant's response
            step_id (int): The step ID within the workflow
        """
        if not self.current_session_id or not self.current_workflow_id:
            raise ValueError("No active session or workflow. Call start_session and start_workflow first.")
        
        # Add to buffer memory
        self.buffer_memory.chat_memory.add_user_message(human_message)
        self.buffer_memory.chat_memory.add_ai_message(ai_message)
        
        # Update session data
        session_data = self.sessions.get(self.current_session_id, {"workflows": []})
        
        for workflow in session_data["workflows"]:
            if workflow["id"] == self.current_workflow_id:
                step_exists = False
                for step in workflow.get("steps", []):
                    if step.get("step_id") == step_id:
                        step["human"] = human_message
                        step["ai"] = ai_message
                        step_exists = True
                        break
                
                if not step_exists:
                    if "steps" not in workflow:
                        workflow["steps"] = []
                    workflow["steps"].append({
                        "step_id": step_id,
                        "human": human_message,
                        "ai": ai_message
                    })
                break
        
        self.sessions[self.current_session_id] = session_data
        
        # Save session data
        with open(self.get_session_file(self.current_session_id), 'w') as f:
            json.dump(session_data, f)
        
        # Save workflow data separately for easier access
        workflow_file = self.get_workflow_file(self.current_session_id, self.current_workflow_id)
        
        for workflow in session_data["workflows"]:
            if workflow["id"] == self.current_workflow_id:
                with open(workflow_file, 'w') as f:
                    json.dump(workflow, f)
                break
    
    def get_memory_for_llm(self):
        """
        Get the combined memory to use with the LLM.
        
        Returns:
            ConversationBufferMemory: The memory object to use with the LLM
        """
        # For simplicity, we're just returning the buffer memory
        # In a more complex implementation, you would combine buffer and summary memories
        return self.buffer_memory
    
    def get_all_sessions(self):
        """
        Get all sessions for the history UI.
        
        Returns:
            list: List of session data
        """
        return self.load_session_index()["sessions"]
    
    def get_session(self, session_id):
        """
        Get a specific session.
        
        Args:
            session_id (str): The session ID
            
        Returns:
            dict: Session data
        """
        session_file = self.get_session_file(session_id)
        if os.path.exists(session_file):
            with open(session_file, 'r') as f:
                return json.load(f)
        return None
    
    def get_workflow(self, session_id, workflow_id):
        """
        Get a specific workflow.
        
        Args:
            session_id (str): The session ID
            workflow_id (str): The workflow ID
            
        Returns:
            dict: Workflow data
        """
        workflow_file = self.get_workflow_file(session_id, workflow_id)
        if os.path.exists(workflow_file):
            with open(workflow_file, 'r') as f:
                return json.load(f)
        return None