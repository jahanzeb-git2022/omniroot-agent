/**
 * Environment tabs component for switching between code editor, terminal, and browser.
 */
import React, { useState, useContext } from 'react';
import CodePage from '../pages/CodePage';
import Terminal from './Terminal';
import Browser from './Browser';
import { ThemeContext } from '../context/ThemeContext';

const EnvironmentTabs = ({ sessionId, workflowId }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('code');

  const tabs = [
    { id: 'code', label: 'Code' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'browser', label: 'Browser' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="flex-1 overflow-auto">
        {activeTab === 'code' && <CodePage sessionId={sessionId} workflowId={workflowId} />}
        {activeTab === 'terminal' && <Terminal sessionId={sessionId} workflowId={workflowId} />}
        {activeTab === 'browser' && <Browser />}
      </div>
    </div>
  );
};

export default EnvironmentTabs;