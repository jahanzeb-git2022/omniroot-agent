/**
 * Main App component that sets up routing and layout.
 * 
 * Updated to implement workflow-per-task model:
 * - Each user task creates a new workflow automatically
 * - Uses ConversationBufferMemory for intra-workflow context
 * - Uses ConversationSummaryMemory for inter-workflow context
 * - New UI layout with sidebar, chat container, and environment tabs
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import DocumentationPage from './pages/DocumentationPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';
import EnvironmentTabs from './components/EnvironmentTabs';
import { ThemeProvider } from './context/ThemeContext';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

function App() {
  // Generate session ID when the app starts
  const [sessionId, setSessionId] = useState(uuidv4());
  const [workflowId, setWorkflowId] = useState(null);
  const [stepId, setStepId] = useState(0);
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
  
  // Function to start a new conversation
  const startNewConversation = () => {
    // Keep the same session but clear workflow to trigger new workflow creation
    setWorkflowId(null);
    setWorkflowName('');
    setStepId(0);
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
  
  // AppContent component to access current location
  const AppContent = () => {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    
    return (
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar onNewConversation={startNewConversation} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Status Bar */}
          <div className="bg-white dark:bg-gray-800 shadow-sm p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Session:</span> {sessionName || sessionId}
                <span className="mx-2">|</span>
                <span className="font-medium">Workflow:</span> {workflowName || 'New Conversation'}
                <span className="mx-2">|</span>
                <span className="font-medium">Step:</span> {stepId}
              </p>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className={`${isHomePage ? 'w-1/2' : 'w-full'} overflow-auto`}>
              <div className="h-full p-4">
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
                  <Route path="/history" element={
                    <HistoryPage 
                      onSelectSession={handleSelectSession}
                      onSelectWorkflow={handleSelectWorkflow}
                    />
                  } />
                  <Route path="/documentation" element={<DocumentationPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Routes>
              </div>
            </div>
            
            {/* Environment Tabs (only shown on home page) */}
            {isHomePage && (
              <div className="w-1/2 border-l border-gray-200 dark:border-gray-700">
                <EnvironmentTabs 
                  sessionId={sessionId}
                  workflowId={workflowId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;