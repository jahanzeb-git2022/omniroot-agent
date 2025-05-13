/**
 * Documentation page component.
 */
import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const DocumentationPage = () => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Documentation</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Learn how to use the Omniroot Agent effectively
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <div className="prose dark:prose-invert max-w-none">
          <h3>Getting Started</h3>
          <p>
            Omniroot Agent is an AI-powered development assistant that helps you with coding tasks, 
            file management, and terminal operations.
          </p>
          
          <h3>Key Features</h3>
          <ul>
            <li>
              <strong>Task-Based Workflows</strong> - Each conversation creates a new workflow automatically
            </li>
            <li>
              <strong>Integrated Development Environment</strong> - Code editor, terminal, and browser in one interface
            </li>
            <li>
              <strong>Context-Aware Memory</strong> - The agent remembers previous conversations and code changes
            </li>
            <li>
              <strong>File Management</strong> - Create, edit, and manage files directly from the interface
            </li>
          </ul>
          
          <h3>Using the Interface</h3>
          <h4>Chat</h4>
          <p>
            Type your questions or instructions in the chat input. The agent will respond and take actions based on your requests.
          </p>
          
          <h4>Code Editor</h4>
          <p>
            The code editor allows you to view and edit files. Enter a file path and click "Load" to open a file.
            Make your changes and click "Save" to save them.
          </p>
          
          <h4>Terminal</h4>
          <p>
            The terminal provides a command-line interface to execute shell commands. Type your commands and press Enter to execute them.
          </p>
          
          <h4>Browser</h4>
          <p>
            The browser tab allows you to view web content. Enter a URL and click "Go" to navigate to a website.
          </p>
          
          <h3>Workflow Management</h3>
          <p>
            Each task you give the agent creates a new workflow. This helps organize your work and maintain context.
            You can access previous workflows from the Conversation History section.
          </p>
          
          <h3>Tips for Effective Use</h3>
          <ul>
            <li>Be specific in your requests to get the most accurate responses</li>
            <li>Use the "New Conversation" button when starting a completely new task</li>
            <li>Check the terminal output for command execution results</li>
            <li>Save your work frequently when editing code</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;