/**
 * Settings page component for configuring the application.
 */
import React, { useContext } from 'react';
import ModelSelector from '../components/ModelSelector';
import { ThemeContext } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Configure the Omniroot Agent
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <FiSun className="h-5 w-5 text-yellow-500" />
            ) : (
              <FiMoon className="h-5 w-5 text-gray-700" />
            )}
            <span className="ml-2">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </div>
      
      <ModelSelector />
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          The Omniroot Agent is a powerful interface for software development with AI assistance.
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          It provides three main tools:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mb-4 ml-4">
          <li>Code Editor: Read and write files in your filesystem</li>
          <li>Terminal: Execute bash commands in your environment</li>
          <li>Browser: View web content and documentation</li>
        </ul>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Version: 1.0.0
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;