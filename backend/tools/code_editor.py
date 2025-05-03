"""
CodeEditor tool for the Agentic Software-Development tool.
This tool allows reading and writing files in the mounted filesystem.
"""
import os
import json
from langchain.tools import BaseTool

class CodeEditorTool(BaseTool):
    name = "CodeEditor"
    description = """
    Read or write files under /sandbox/code which is volume-mounted to the user's $HOME.
    
    Input should be a JSON object with the following fields:
    - "action": "read" or "write"
    - "file_path": The path to the file (can be relative or absolute)
    - "content": (Only for "write" action) The content to write to the file
    
    Output will be a JSON object with:
    - "status": "success" or "error"
    - "message": A message describing the result
    - "content": (Only for "read" action) The content of the file
    
    Example (write file):
    {"action":"write","file_path":"insertion_sort.py","content":"def insertion_sort(arr):\\n    for i in range(1,len(arr)):\\n        key=arr[i]\\n        j=i-1\\n        while j>=0 and arr[j]>key:\\n            arr[j+1]=arr[j]\\n            j-=1\\n        arr[j+1]=key\\n    return arr\\n\\nif __name__=='__main__':\\n    print(insertion_sort([5,2,9,1,5,6]))\\n"}
    
    Example (read file):
    {"action":"read","file_path":"insertion_sort.py"}
    """
    
    def _run(self, input_str):
        """
        Run the CodeEditor tool.
        
        Args:
            input_str (str): JSON string with action, file_path, and optionally content
            
        Returns:
            str: JSON string with status, message, and optionally content
        """
        try:
            # Parse input
            input_data = json.loads(input_str) if isinstance(input_str, str) else input_str
            action = input_data.get("action", "").lower()
            file_path = input_data.get("file_path", "")
            
            # Ensure the path is within the mounted directory
            if not file_path.startswith('/sandbox/code/'):
                file_path = os.path.join('/sandbox/code', file_path.lstrip('/'))
            
            # Handle read action
            if action == "read":
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    return json.dumps({
                        "status": "success",
                        "message": f"File {file_path} read successfully",
                        "content": content
                    })
                except Exception as e:
                    return json.dumps({
                        "status": "error",
                        "message": f"Error reading file: {str(e)}",
                        "content": ""
                    })
            
            # Handle write action
            elif action == "write":
                content = input_data.get("content", "")
                try:
                    # Create directory if it doesn't exist
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    with open(file_path, 'w') as f:
                        f.write(content)
                    
                    return json.dumps({
                        "status": "success",
                        "message": f"Wrote {os.path.basename(file_path)}"
                    })
                except Exception as e:
                    return json.dumps({
                        "status": "error",
                        "message": f"Error writing file: {str(e)}"
                    })
            
            # Handle invalid action
            else:
                return json.dumps({
                    "status": "error",
                    "message": f"Invalid action: {action}. Must be 'read' or 'write'."
                })
                
        except Exception as e:
            return json.dumps({
                "status": "error",
                "message": f"Error parsing input: {str(e)}"
            })
    
    def _arun(self, query):
        """
        Async version of _run (not implemented).
        """
        raise NotImplementedError("CodeEditorTool does not support async")