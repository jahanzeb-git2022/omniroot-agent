/**
 * Settings page component for configuring the application.
 */
import React from 'react';
import ModelSelector from '../components/ModelSelector';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure the Agentic Software-Development Tool
          </p>
        </div>
      </div>
      
      <ModelSelector />
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
        <p className="text-sm text-gray-700 mb-2">
          The Agentic Software-Development Tool is a powerful interface for software development with AI assistance.
        </p>
        <p className="text-sm text-gray-700 mb-2">
          It provides two main tools:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 mb-4 ml-4">
          <li>CodeEditor: Read and write files in your filesystem</li>
          <li>Shell: Execute bash commands in your environment</li>
        </ul>
        <p className="text-sm text-gray-700">
          Version: 1.0.0
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;