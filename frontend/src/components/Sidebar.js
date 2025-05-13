/**
 * Sidebar component for navigation and actions.
 */
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiMessageSquare, 
  FiClock, 
  FiBook, 
  FiSettings, 
  FiUser,
  FiPlus
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

const Sidebar = ({ onNewConversation }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const navItems = [
    {
      id: 'new-conversation',
      label: 'New Conversation',
      icon: <FiPlus className="w-6 h-6" />,
      action: onNewConversation,
      isButton: true
    },
    {
      id: 'history',
      label: 'Conversation History',
      icon: <FiClock className="w-6 h-6" />,
      path: '/history'
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: <FiBook className="w-6 h-6" />,
      path: '/documentation'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <FiSettings className="w-6 h-6" />,
      path: '/settings'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <FiUser className="w-6 h-6" />,
      path: '/profile'
    }
  ];

  return (
    <div className="h-full bg-gray-800 text-white w-64 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold flex items-center">
          <FiMessageSquare className="mr-2" />
          Omniroot Agent
        </h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              {item.isButton ? (
                <button
                  onClick={item.action}
                  className="flex items-center w-full p-3 rounded-md hover:bg-indigo-600 transition-colors bg-indigo-700 text-white"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;