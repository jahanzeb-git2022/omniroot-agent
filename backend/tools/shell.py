"""
Shell tool for the Agentic Software-Development tool.
This tool allows executing bash commands in the container.
"""
import os
import json
import subprocess
from langchain.tools import BaseTool

class ShellTool(BaseTool):
    name = "Shell"
    description = """
    Execute bash commands inside the container's /sandbox/code or anywhere under the mounted home.
    
    Input should be a string with the bash command to execute.
    
    Output will be a JSON object with:
    - "exit_code": The exit code of the command
    - "stdout": The standard output of the command
    - "stderr": The standard error of the command
    """
    
    def _run(self, command):
        """
        Run a shell command.
        
        Args:
            command (str): The bash command to execute
            
        Returns:
            str: JSON string with exit_code, stdout, and stderr
        """
        try:
            # Execute the command
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd="/sandbox/code"  # Set working directory to the mounted directory
            )
            
            # Get output
            stdout, stderr = process.communicate()
            exit_code = process.returncode
            
            # Return result
            return json.dumps({
                "exit_code": exit_code,
                "stdout": stdout,
                "stderr": stderr
            })
            
        except Exception as e:
            return json.dumps({
                "exit_code": 1,
                "stdout": "",
                "stderr": f"Error executing command: {str(e)}"
            })
    
    def _arun(self, query):
        """
        Async version of _run (not implemented).
        """
        raise NotImplementedError("ShellTool does not support async")