/**
 * Chat page component for interacting with the AI agent.
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatPage = ({ sessionId, workflowId, stepId, incrementStepId, workflowName }) => {
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
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        session_id: sessionId,
        workflow_id: workflowId,
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Chat with Agent
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {workflowName || `Workflow: ${workflowId}`} | Step: {stepId}
        </p>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p>No messages yet. Start a conversation with the agent.</p>
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
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-indigo-100 text-indigo-800' 
                      : message.role === 'system' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            <div className="text-center text-gray-500 my-4">
              <p>Agent is thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;