/**
 * History page component for viewing and managing past sessions and workflows.
 */
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const HistoryPage = ({ onSelectSession, onSelectWorkflow }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/sessions');
        setSessions(response.data.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load session history');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fetch session details when a session is selected
  useEffect(() => {
    if (selectedSession) {
      const fetchSessionDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/session/${selectedSession.id}`);
          setSelectedSession(response.data);
        } catch (err) {
          console.error('Error fetching session details:', err);
          setError('Failed to load session details');
        }
      };

      fetchSessionDetails();
    }
  }, [selectedSession?.id]);

  // Fetch workflow details when a workflow is selected
  useEffect(() => {
    if (selectedSession && selectedWorkflow) {
      const fetchWorkflowDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/workflow/${selectedSession.id}/${selectedWorkflow.id}`);
          setSelectedWorkflow(response.data);
        } catch (err) {
          console.error('Error fetching workflow details:', err);
          setError('Failed to load workflow details');
        }
      };

      fetchWorkflowDetails();
    }
  }, [selectedSession?.id, selectedWorkflow?.id]);

  // Handle session selection
  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setSelectedWorkflow(null);
  };

  // Handle workflow selection
  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
  };

  // Continue with selected session/workflow
  const handleContinue = () => {
    if (selectedSession) {
      onSelectSession(selectedSession.id);
      
      if (selectedWorkflow) {
        onSelectWorkflow(selectedSession.id, selectedWorkflow.id);
      }
      
      navigate('/');
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (loading && !selectedSession) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Session History</h2>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading history...</div>
      </div>
    );
  }

  if (error && !selectedSession && !selectedWorkflow) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Session History</h2>
        <div className="text-center text-red-500 dark:text-red-400 py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Session History</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          View and continue past sessions and workflows
        </p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {/* Sessions List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sessions</h3>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.length === 0 ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">No sessions found</li>
            ) : (
              sessions.map((session) => (
                <li 
                  key={session.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedSession?.id === session.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30' 
                      : ''
                  }`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{session.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(session.created_at)}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {session.workflows?.length || 0} workflows
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Workflows List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Workflows</h3>
          </div>
          {!selectedSession ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Select a session to view workflows</div>
          ) : selectedSession.workflows?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No workflows in this session</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedSession.workflows?.map((workflow) => (
                <li 
                  key={workflow.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedWorkflow?.id === workflow.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30' 
                      : ''
                  }`}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{workflow.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {workflow.steps?.length || 0} steps
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Steps/Details */}
        <div className="w-1/3 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Steps</h3>
          </div>
          {!selectedWorkflow ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Select a workflow to view steps</div>
          ) : selectedWorkflow.steps?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No steps in this workflow</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedWorkflow.steps?.map((step) => (
                <li key={step.step_id} className="p-4">
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      Step {step.step_id}
                    </span>
                  </div>
                  <div className="mb-2 bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30 p-2 rounded text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-300">User:</p>
                    <p className="text-gray-900 dark:text-gray-100">{step.human}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Assistant:</p>
                    <p className="text-gray-900 dark:text-gray-100">{step.ai}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
        <button
          onClick={handleContinue}
          disabled={!selectedSession}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            selectedSession 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          Continue Selected {selectedWorkflow ? 'Workflow' : 'Session'}
        </button>
      </div>
    </div>
  );
};

export default HistoryPage;