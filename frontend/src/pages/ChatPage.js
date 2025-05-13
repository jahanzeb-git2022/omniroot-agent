/**
 * Chat page component for interacting with the AI agent.
 * 
 * Updated to implement workflow-per-task model:
 * - Each new task (first message) creates a new workflow
 * - Uses the updateWorkflowId callback to update the parent component
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const ChatPage = ({ sessionId, workflowId, stepId, incrementStepId, workflowName, updateWorkflowId }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing workflow steps when workflow changes
  useEffect(() => {
    const loadWorkflowMessages = async () => {
      if (workflowId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/workflow/${sessionId}/${workflowId}`);
          const workflow = response.data;
          
          if (workflow && workflow.steps && workflow.steps.length > 0) {
            // Convert workflow steps to messages format
            const loadedMessages = [];
            workflow.steps.forEach(step => {
              if (step.human) {
                loadedMessages.push({
                  role: 'user',
                  content: step.human,
                  timestamp: new Date().toISOString(),
                  step_id: step.step_id
                });
              }
              if (step.ai) {
                loadedMessages.push({
                  role: 'assistant',
                  content: step.ai,
                  timestamp: new Date().toISOString(),
                  step_id: step.step_id
                });
              }
            });
            
            setMessages(loadedMessages);
          } else {
            // Clear messages if no steps found
            setMessages([]);
          }
        } catch (error) {
          console.error('Error loading workflow messages:', error);
          // Don't clear messages on error to avoid losing context
        }
      }
    };
    
    loadWorkflowMessages();
  }, [sessionId, workflowId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      step_id: stepId
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to backend
      // The backend will create a new workflow for each task (first message)
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        session_id: sessionId,
        workflow_id: workflowId, // This will be null for a new task
        workflow_name: workflowName,
        step_id: stepId
      });

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        step_id: stepId
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Update workflow ID if this was a new task
      if (response.data.workflow_id && (!workflowId || response.data.workflow_id !== workflowId)) {
        // Call the updateWorkflowId function from props
        if (updateWorkflowId) {
          const taskPreview = input.length > 50 ? `${input.substring(0, 50)}...` : input;
          updateWorkflowId(response.data.workflow_id, `Task: ${taskPreview}`);
        }
      }
      
      // Increment step ID for next interaction
      incrementStepId();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = {
        role: 'system',
        content: 'Error: Could not connect to the agent. Please try again.',
        timestamp: new Date().toISOString(),
        step_id: stepId
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Chat with Agent
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          {workflowName || `Workflow: ${workflowId || 'New'}`} | Step: {stepId}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with the agent by typing a message below.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${
                message.role === 'user' 
                  ? 'text-right' 
                  : message.role === 'system' 
                    ? 'text-center' 
                    : 'text-left'
              }`}
            >
              <div 
                className={`inline-block p-3 rounded-lg max-w-3xl ${
                  message.role === 'user' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' 
                    : message.role === 'system' 
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>
                    {message.step_id !== undefined ? `Step ${message.step_id}` : ''}
                  </span>
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
              <div className="h-2 w-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
              <div className="h-2 w-2 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
            </div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Agent is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;