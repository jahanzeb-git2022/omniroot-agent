/**
 * Main App component that sets up routing and layout.
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import CodePage from './pages/CodePage';
import HistoryPage from './pages/HistoryPage';
import HistorySidebar from './components/HistorySidebar';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

function App() {
  // Generate session ID when the app starts
  const [sessionId, setSessionId] = useState(uuidv4());
  const [workflowId, setWorkflowId] = useState(uuidv4());
  const [stepId, setStepId] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [sessionName, setSessionName] = useState('');
  
  // Function to start a new workflow
  const startNewWorkflow = () => {
    const newWorkflowId = uuidv4();
    setWorkflowId(newWorkflowId);
    setWorkflowName(`Workflow ${new Date().toLocaleString()}`);
    setStepId(0);
  };
  
  // Function to start a new session
  const startNewSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setSessionName(`Session ${new Date().toLocaleString()}`);
    startNewWorkflow();
  };
  
  // Function to increment step ID
  const incrementStepId = () => {
    setStepId(prevStepId => prevStepId + 1);
  };
  
  // Function to handle session selection from history
  const handleSelectSession = (selectedSessionId) => {
    setSessionId(selectedSessionId);
    // Fetch session details to get the latest workflow
    axios.get(`http://localhost:5000/api/session/${selectedSessionId}`)
      .then(response => {
        const session = response.data;
        setSessionName(session.name || `Session ${selectedSessionId}`);
        
        // If the session has workflows, select the most recent one
        if (session.workflows && session.workflows.length > 0) {
          const latestWorkflow = session.workflows[session.workflows.length - 1];
          setWorkflowId(latestWorkflow.id);
          setWorkflowName(latestWorkflow.name || `Workflow ${latestWorkflow.id}`);
          
          // If the workflow has steps, set the step ID to the next step
          if (latestWorkflow.steps && latestWorkflow.steps.length > 0) {
            const maxStepId = Math.max(...latestWorkflow.steps.map(step => step.step_id));
            setStepId(maxStepId + 1);
          } else {
            setStepId(0);
          }
        } else {
          // If no workflows, start a new one
          startNewWorkflow();
        }
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        // If error, start a new workflow in this session
        startNewWorkflow();
      });
  };
  
  // Function to handle workflow selection from history
  const handleSelectWorkflow = (selectedSessionId, selectedWorkflowId) => {
    setSessionId(selectedSessionId);
    setWorkflowId(selectedWorkflowId);
    
    // Fetch workflow details
    axios.get(`http://localhost:5000/api/workflow/${selectedSessionId}/${selectedWorkflowId}`)
      .then(response => {
        const workflow = response.data;
        setWorkflowName(workflow.name || `Workflow ${selectedWorkflowId}`);
        
        // If the workflow has steps, set the step ID to the next step
        if (workflow.steps && workflow.steps.length > 0) {
          const maxStepId = Math.max(...workflow.steps.map(step => step.step_id));
          setStepId(maxStepId + 1);
        } else {
          setStepId(0);
        }
      })
      .catch(error => {
        console.error('Error fetching workflow:', error);
        setStepId(0);
      });
  };
  
  // Toggle history sidebar
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Agentic Dev Tool</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Chat
                  </Link>
                  <Link to="/code" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Agentic Code
                  </Link>
                  <Link to="/history" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    History
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleHistory}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
                <button
                  onClick={startNewWorkflow}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  New Workflow
                </button>
                <button
                  onClick={startNewSession}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  New Session
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex overflow-hidden">
          {showHistory && (
            <div className="w-64 flex-shrink-0">
              <HistorySidebar 
                onSelectSession={handleSelectSession}
                onSelectWorkflow={handleSelectWorkflow}
                currentSessionId={sessionId}
                currentWorkflowId={workflowId}
              />
            </div>
          )}
          
          <div className="flex-1 overflow-auto py-6">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Current Session:</span> {sessionName || sessionId}
                  <span className="mx-2">|</span>
                  <span className="font-medium">Current Workflow:</span> {workflowName || workflowId}
                  <span className="mx-2">|</span>
                  <span className="font-medium">Step:</span> {stepId}
                </p>
              </div>
              
              <Routes>
                <Route path="/" element={
                  <ChatPage 
                    sessionId={sessionId} 
                    workflowId={workflowId} 
                    stepId={stepId} 
                    incrementStepId={incrementStepId}
                    workflowName={workflowName}
                  />
                } />
                <Route path="/code" element={<CodePage />} />
                <Route path="/history" element={
                  <HistoryPage 
                    onSelectSession={handleSelectSession}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                } />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;