"""
Memory management module for the Agentic Software-Development tool.
This module handles the combination of buffer and summary memory for efficient context management.
"""
import os
import json
import logging
import time
from datetime import datetime
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from backend.api.llm_manager import get_llm, DEFAULT_CONFIGS

# Configure logging
logger = logging.getLogger(__name__)

class EnhancedMemoryManager:
    """
    Enhanced memory manager that combines buffer memory for recent workflows
    and summary memory for older workflows to optimize token usage.
    """
    
    def __init__(self, history_path="/host_home/.agent_history", max_buffer_workflows=5, llm_config=None):
        """
        Initialize the memory manager.
        
        Args:
            history_path (str): Path to store history files
            max_buffer_workflows (int): Maximum number of workflows to keep in buffer memory
            llm_config (dict, optional): Configuration for the LLM
        """
        self.history_path = history_path
        self.max_buffer_workflows = max_buffer_workflows
        self.current_session_id = None
        self.current_workflow_id = None
        
        # Create history directory if it doesn't exist
        os.makedirs(history_path, exist_ok=True)
        
        # Use default config if none provided
        self.llm_config = llm_config or DEFAULT_CONFIGS["huggingface"]
        
        # Initialize the LLM for summary memory using the LiteLLM wrapper
        self.llm = get_llm(self.llm_config)
        
        # Initialize memories - one buffer memory per workflow
        self.workflow_memories = {}
        
        # Initialize summary memory for previous workflows
        self.summary_memory = ConversationSummaryMemory(
            llm=self.llm,
            memory_key="chat_history_summary",
            return_messages=True
        )
        
        # Track workflow order and summaries
        self.workflow_order = []
        self.workflow_summaries = {}
        
        # Session data
        self.sessions = {}
        
        logger.info(f"EnhancedMemoryManager initialized with history path: {history_path}")
        
        # Load existing workflow summaries
        self._load_workflow_summaries()
    
    def get_session_file(self, session_id):
        """Get the path to a session file."""
        return os.path.join(self.history_path, f"session_{session_id}.json")
    
    def get_workflow_file(self, session_id, workflow_id):
        """Get the path to a workflow file."""
        session_dir = os.path.join(self.history_path, f"session_{session_id}")
        os.makedirs(session_dir, exist_ok=True)
        return os.path.join(session_dir, f"workflow_{workflow_id}.json")
        
    def get_summaries_file(self):
        """Get the path to the workflow summaries file."""
        return os.path.join(self.history_path, "workflow_summaries.json")
        
    def _load_workflow_summaries(self):
        """Load existing workflow summaries from file."""
        summaries_file = self.get_summaries_file()
        if os.path.exists(summaries_file):
            try:
                with open(summaries_file, 'r') as f:
                    self.workflow_summaries = json.load(f)
                logger.info(f"Loaded {len(self.workflow_summaries)} workflow summaries")
            except Exception as e:
                logger.error(f"Error loading workflow summaries: {str(e)}")
                self.workflow_summaries = {}
        else:
            logger.info("No workflow summaries file found, starting with empty summaries")
            self.workflow_summaries = {}
    
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
    
    def start_workflow(self, workflow_id, workflow_name=None, task=None):
        """
        Start a new workflow or continue an existing one.
        
        Args:
            workflow_id (str): The workflow ID
            workflow_name (str, optional): A human-readable name for the workflow
            task (str, optional): The task description for this workflow
        """
        if not self.current_session_id:
            raise ValueError("No active session. Call start_session first.")
        
        self.current_workflow_id = workflow_id
        logger.info(f"Starting workflow: {workflow_id} - {workflow_name}")
        
        # Update session data
        session_data = self.sessions.get(self.current_session_id, {"workflows": []})
        
        workflow_exists = False
        for workflow in session_data["workflows"]:
            if workflow["id"] == workflow_id:
                workflow_exists = True
                if workflow_name and not workflow.get("name"):
                    workflow["name"] = workflow_name
                if task and not workflow.get("task"):
                    workflow["task"] = task
                break
        
        if not workflow_exists:
            # Create a new workflow with timestamp
            timestamp = datetime.now().timestamp()
            new_workflow = {
                "id": workflow_id,
                "name": workflow_name or f"Workflow {len(session_data['workflows']) + 1}",
                "task": task or "",
                "created_at": timestamp,
                "steps": []
            }
            session_data["workflows"].append(new_workflow)
            logger.info(f"Created new workflow: {workflow_id} - {workflow_name}")
            
        self.sessions[self.current_session_id] = session_data
        
        # Save session data
        with open(self.get_session_file(self.current_session_id), 'w') as f:
            json.dump(session_data, f)
        
        # Create a new buffer memory for this workflow if it doesn't exist
        if workflow_id not in self.workflow_memories:
            self.workflow_memories[workflow_id] = ConversationBufferMemory(
                memory_key="chat_history", 
                return_messages=True
            )
            
            # If we have previous workflow summaries, add them to the context
            if self.workflow_summaries:
                # Add previous workflow summaries to the memory
                previous_summaries = "\n\n".join([
                    f"Previous workflow '{summary.get('name', wid)}': {summary.get('summary', '')}"
                    for wid, summary in self.workflow_summaries.items()
                    if wid != workflow_id
                ])
                
                if previous_summaries:
                    logger.info(f"Adding {len(self.workflow_summaries)} previous workflow summaries to context")
                    self.workflow_memories[workflow_id].chat_memory.add_system_message(
                        f"Context from previous workflows:\n{previous_summaries}"
                    )
        
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
        logger.info(f"Summarizing workflow: {workflow_id}")
        
        # Find the session that contains this workflow
        session_id = self.current_session_id
        workflow_data = None
        workflow_name = f"Workflow {workflow_id}"
        workflow_task = ""
        
        # Try to find the workflow in all sessions if not in current session
        if not session_id or not self._workflow_in_session(session_id, workflow_id):
            for sid in self.sessions:
                if self._workflow_in_session(sid, workflow_id):
                    session_id = sid
                    break
        
        if session_id:
            workflow_file = self.get_workflow_file(session_id, workflow_id)
            
            if os.path.exists(workflow_file):
                try:
                    with open(workflow_file, 'r') as f:
                        workflow_data = json.load(f)
                    
                    workflow_name = workflow_data.get("name", workflow_name)
                    workflow_task = workflow_data.get("task", "")
                except Exception as e:
                    logger.error(f"Error loading workflow file: {str(e)}")
        
        if not workflow_data:
            logger.warning(f"Could not find workflow data for {workflow_id}")
            return
        
        # Create a summary of the workflow
        messages = []
        for step in workflow_data.get("steps", []):
            if "human" in step:
                messages.append(f"User: {step['human']}")
            if "ai" in step:
                messages.append(f"Assistant: {step['ai']}")
        
        workflow_text = "\n".join(messages)
        
        if not workflow_text:
            logger.warning(f"No messages found in workflow {workflow_id}")
            return
        
        try:
            # Generate a summary using the LLM
            summary_prompt = f"""
            Please summarize the following conversation about a task. 
            Focus on the key actions taken, code written, and results achieved.
            
            Task: {workflow_task}
            
            Conversation:
            {workflow_text}
            
            Summary:
            """
            
            logger.info(f"Generating summary for workflow {workflow_id}")
            summary = self.llm(summary_prompt)
            
            # Store the summary
            self.workflow_summaries[workflow_id] = {
                "name": workflow_name,
                "task": workflow_task,
                "summary": summary,
                "timestamp": time.time()
            }
            
            # Save summaries to file
            with open(self.get_summaries_file(), 'w') as f:
                json.dump(self.workflow_summaries, f)
            
            logger.info(f"Workflow {workflow_id} summarized and saved")
            
            # Remove the workflow memory to free up resources
            if workflow_id in self.workflow_memories:
                del self.workflow_memories[workflow_id]
                
        except Exception as e:
            logger.error(f"Error summarizing workflow: {str(e)}", exc_info=True)
    
    def _workflow_in_session(self, session_id, workflow_id):
        """Check if a workflow exists in a session."""
        if session_id in self.sessions:
            for workflow in self.sessions[session_id].get("workflows", []):
                if workflow.get("id") == workflow_id:
                    return True
        return False
    
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
        
        logger.info(f"Adding interaction to workflow {self.current_workflow_id}, step {step_id}")
        
        # Add to workflow-specific buffer memory
        if self.current_workflow_id not in self.workflow_memories:
            self.workflow_memories[self.current_workflow_id] = ConversationBufferMemory(
                memory_key="chat_history", 
                return_messages=True
            )
            
        self.workflow_memories[self.current_workflow_id].chat_memory.add_user_message(human_message)
        self.workflow_memories[self.current_workflow_id].chat_memory.add_ai_message(ai_message)
        
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
                        "ai": ai_message,
                        "timestamp": datetime.now().timestamp()
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
    
    def get_memory_for_llm(self, workflow_id=None):
        """
        Get the memory to use with the LLM for a specific workflow.
        
        Args:
            workflow_id (str, optional): The workflow ID to get memory for.
                                        If None, uses the current workflow.
        
        Returns:
            ConversationBufferMemory: The memory object to use with the LLM
        """
        wid = workflow_id or self.current_workflow_id
        
        if not wid:
            logger.warning("No workflow ID provided and no current workflow. Returning empty memory.")
            return ConversationBufferMemory(memory_key="chat_history", return_messages=True)
            
        # If we don't have a memory for this workflow yet, create one
        if wid not in self.workflow_memories:
            self.workflow_memories[wid] = ConversationBufferMemory(
                memory_key="chat_history", 
                return_messages=True
            )
            
            # If we have previous workflow summaries, add them to the context
            if self.workflow_summaries:
                previous_summaries = "\n\n".join([
                    f"Previous workflow '{summary.get('name', w_id)}': {summary.get('summary', '')}"
                    for w_id, summary in self.workflow_summaries.items()
                    if w_id != wid
                ])
                
                if previous_summaries:
                    self.workflow_memories[wid].chat_memory.add_system_message(
                        f"Context from previous workflows:\n{previous_summaries}"
                    )
        
        return self.workflow_memories[wid]
    
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