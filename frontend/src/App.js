/**
 * Main App component that sets up routing and layout.
 * 
 * Updated to implement workflow-per-task model:
 * - Each user task creates a new workflow automatically
 * - Removed manual New Session and New Workflow buttons
 * - Uses ConversationBufferMemory for intra-workflow context
 * - Uses ConversationSummaryMemory for inter-workflow context
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import CodePage from './pages/CodePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import HistorySidebar from './components/HistorySidebar';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

function App() {
  // Generate session ID when the app starts
  const [sessionId, setSessionId] = useState(uuidv4());
  const [workflowId, setWorkflowId] = useState(null);
  const [stepId, setStepId] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [sessionName, setSessionName] = useState(`Session ${new Date().toLocaleString()}`);
  
  // Initialize session on component mount
  useEffect(() => {
    // Check if backend is available
    axios.get('http://localhost:5000/api/health')
      .then(response => {
        console.log('Backend health check:', response.data);
      })
      .catch(error => {
        console.error('Backend health check failed:', error);
      });
      
    // Initialize session
    const initSession = async () => {
      try {
        // Create a session with the current ID
        await axios.get(`http://localhost:5000/api/session/${sessionId}`)
          .then(response => {
            if (response.data && response.data.name) {
              setSessionName(response.data.name);
            }
          })
          .catch(() => {
            // Session doesn't exist yet, which is fine for a new session
            console.log('Creating new session:', sessionId);
          });
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };
    
    initSession();
  }, [sessionId]);
  
  // Function to increment step ID
  const incrementStepId = () => {
    setStepId(prevStepId => prevStepId + 1);
  };
  
  // Function to update workflow ID from chat response
  const updateWorkflowId = (newWorkflowId, newWorkflowName) => {
    if (newWorkflowId && newWorkflowId !== workflowId) {
      setWorkflowId(newWorkflowId);
      if (newWorkflowName) {
        setWorkflowName(newWorkflowName);
      }
    }
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
          // If no workflows, clear workflow ID to trigger new workflow creation
          setWorkflowId(null);
          setWorkflowName('');
          setStepId(0);
        }
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        // If error, clear workflow ID to trigger new workflow creation
        setWorkflowId(null);
        setWorkflowName('');
        setStepId(0);
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
                  <Link to="/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Settings
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
                    updateWorkflowId={updateWorkflowId}
                  />
                } />
                <Route path="/code" element={<CodePage />} />
                <Route path="/history" element={
                  <HistoryPage 
                    onSelectSession={handleSelectSession}
                    onSelectWorkflow={handleSelectWorkflow}
                  />
                } />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;