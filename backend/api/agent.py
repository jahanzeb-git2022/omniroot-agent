"""
Agent configuration module.
This file sets up the LangChain agent with the appropriate tools and memory.
"""
import os
from langchain.agents import initialize_agent, AgentType
from langchain.llms import HuggingFaceHub
from langchain.memory import ConversationBufferMemory

def create_agent(tools, memory=None):
    """
    Create a LangChain agent with the specified tools and memory.
    
    Args:
        tools (list): List of LangChain tools to use with the agent
        memory (ConversationBufferMemory, optional): Memory to use with the agent
    
    Returns:
        Agent: Initialized LangChain agent
    """
    # Initialize memory if not provided
    if memory is None:
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    # Initialize the LLM (Qwen3-235B-A22B from Huggingface)
    llm = HuggingFaceHub(
        repo_id="Qwen/Qwen3-235B-A22B",
        huggingfacehub_api_token=os.environ.get("HUGGINGFACEHUB_API_TOKEN", "YOUR_HUGGINGFACE_TOKEN"),
        model_kwargs={
            "temperature": 0.2,
            "max_length": 4096,
            "top_p": 0.9
        }
    )
    
    # Initialize the agent
    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=6,  # Allow for retries
        early_stopping_method="generate"
    )
    
    # Custom prompt with error handling instructions
    agent.agent.llm_chain.prompt.template += """
When using tools, follow these guidelines:
1. If a tool call fails, reflect on the error and retry up to 2 times with corrected parameters.
2. Document your thought process for each step in the workflow.
3. Maintain a structured approach: Thought → Action → Observation → Final Answer.
4. Preserve all context and history across sessions.

Remember that you are an agentic software development assistant with access to:
- CodeEditor: Read and write files in the user's filesystem
- Shell: Execute commands in the user's environment

Your goal is to help the user develop software efficiently and effectively.

Example workflows:

1.
User: Code an Insertion Sort algorithm in Python and test it.

Thought: I need to create the Python file for the algorithm.
Action: CodeEditor
Action Input: {"action":"read","file_path":"insertion_sort.py","content":"def insertion_sort(arr):\n    for i in range(1,len(arr)):\n        key=arr[i]\n        j=i-1\n        while j>=0 and arr[j]>key:\n            arr[j+1]=arr[j]\n            j-=1\n        arr[j+1]=key\n    return arr\n\nif __name__=='__main__':\n    print(insertion_sort([5,2,9,1,5,6]))\n"}
Observation: {"status":"success","message":"Wrote insertion_sort.py"}

Thought: The file is ready. Now test it.
Action: Shell
Action Input: python insertion_sort.py
Observation: {"exit_code":0,"stdout":"[1, 2, 5, 5, 6, 9]\n","stderr":""}

Thought: The output is correct. Return the final code.

2. 
User: Create and run a pytest for insertion_sort.

Thought: I should scaffold a test file.
Action: CodeEditor
Action Input: {"action":"write","file_path":"test_insertion_sort.py","content":"import pytest\nfrom insertion_sort import insertion_sort\n\ndef test_sorted():\n    assert insertion_sort([3,1,2])==[1,2,3]\n"}
Observation: {"status":"success","message":"Wrote test_insertion_sort.py"}

Thought: Now run pytest.
Action: Shell
Action Input: pytest --maxfail=1 --disable-warnings
Observation: {"exit_code":0,"stdout":"1 passed","stderr":""}

Thought: Tests passed. Report results.
Action: None
Final Answer:
✅ test_insertion_sort.py passed 1 test.

3.
User: I forgot where I saved credentials.pdf. Find it in my home directory.

Thought: I will search the mounted home folder.
Action: Shell
Action Input: find /host_home -type f -name 'credentials.pdf'
Observation: {"exit_code":0,"stdout":"/host_home/Documents/credentials.pdf\n","stderr":""}

Thought: Found the file path. Return it.
Action: None
Final Answer:
/home/username/Documents/credentials.pdf
"""
    
    return agent