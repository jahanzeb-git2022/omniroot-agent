/**
 * History sidebar component for displaying and navigating past sessions and workflows.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HistorySidebar = ({ onSelectSession, onSelectWorkflow, currentSessionId, currentWorkflowId }) => {
  const [sessions, setSessions] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/sessions');
        setSessions(response.data.sessions || []);
        
        // Initialize expanded state for current session
        if (currentSessionId) {
          setExpandedSessions(prev => ({
            ...prev,
            [currentSessionId]: true
          }));
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load session history');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [currentSessionId]);

  // Toggle session expansion
  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Handle session selection
  const handleSessionSelect = (sessionId) => {
    onSelectSession(sessionId);
    // Expand the session when selected
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: true
    }));
  };

  // Handle workflow selection
  const handleWorkflowSelect = (sessionId, workflowId) => {
    onSelectWorkflow(sessionId, workflowId);
  };

  if (loading) {
    return (
      <div className="p-4 border-r border-gray-200 h-full bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
        <div className="text-center text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-r border-gray-200 h-full bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-r border-gray-200 h-full bg-gray-50 overflow-y-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
      
      {sessions.length === 0 ? (
        <div className="text-center text-gray-500">No session history found</div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="border border-gray-200 rounded-md overflow-hidden">
              <div 
                className={`flex justify-between items-center p-3 cursor-pointer ${
                  currentSessionId === session.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'bg-white'
                }`}
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex-1">
                  <h4 
                    className="font-medium text-gray-900 hover:text-indigo-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionSelect(session.id);
                    }}
                  >
                    {session.name}
                  </h4>
                  <p className="text-xs text-gray-500">{formatDate(session.created_at)}</p>
                </div>
                <span className="text-gray-400">
                  {expandedSessions[session.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </div>
              
              {expandedSessions[session.id] && (
                <div className="bg-gray-50 p-2">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">Workflows</h5>
                  {session.workflows && session.workflows.length > 0 ? (
                    <ul className="space-y-1">
                      {session.workflows.map((workflow) => (
                        <li 
                          key={workflow.id}
                          className={`text-sm p-2 rounded cursor-pointer ${
                            currentWorkflowId === workflow.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleWorkflowSelect(session.id, workflow.id)}
                        >
                          {workflow.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No workflows in this session</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistorySidebar;