/**
 * Code page component with Monaco editor for editing files.
 */
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const CodePage = () => {
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);

  // Load file content
  const loadFile = async () => {
    if (!filePath) return;
    
    setIsLoading(true);
    setStatus('Loading file...');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/read_file?file_path=${encodeURIComponent(filePath)}`);
      
      if (response.data.status === 'success') {
        setFileContent(response.data.content);
        setStatus(`File loaded: ${filePath}`);
        
        // Add to recent files if not already there
        if (!recentFiles.includes(filePath)) {
          setRecentFiles(prev => [filePath, ...prev].slice(0, 10));
        }
      } else {
        setStatus(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save file content
  const saveFile = async () => {
    if (!filePath) {
      setStatus('Error: No file path specified');
      return;
    }
    
    setIsLoading(true);
    setStatus('Saving file...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/edit_file', {
        file_path: filePath,
        content: fileContent
      });
      
      if (response.data.status === 'success') {
        setStatus(`File saved: ${filePath}`);
        
        // Add to recent files if not already there
        if (!recentFiles.includes(filePath)) {
          setRecentFiles(prev => [filePath, ...prev].slice(0, 10));
        }
      } else {
        setStatus(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editor change
  const handleEditorChange = (value) => {
    setFileContent(value);
  };

  // Handle file path change
  const handleFilePathChange = (e) => {
    setFilePath(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    loadFile();
  };

  // Handle recent file selection
  const handleRecentFileClick = (path) => {
    setFilePath(path);
    // Load the file after setting the path
    setTimeout(loadFile, 0);
  };

  // Determine file language for Monaco editor
  const getLanguage = () => {
    if (!filePath) return 'plaintext';
    
    const extension = filePath.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'txt': 'plaintext',
      'sh': 'shell',
      'bash': 'shell',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'cpp',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php'
    };
    
    return languageMap[extension] || 'plaintext';
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Agentic Code Editor
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Edit files in the mounted filesystem
        </p>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex">
            <input
              type="text"
              value={filePath}
              onChange={handleFilePathChange}
              placeholder="Enter file path (e.g., /sandbox/code/myfile.js)"
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-none hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Load
            </button>
            <button
              type="button"
              onClick={saveFile}
              className="bg-green-600 text-white px-4 py-2 rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Save
            </button>
          </div>
        </form>
        
        {recentFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Files:</h4>
            <div className="flex flex-wrap gap-2">
              {recentFiles.map((path, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentFileClick(path)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                >
                  {path.split('/').pop()}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <Editor
            height="70vh"
            language={getLanguage()}
            value={fileContent}
            onChange={handleEditorChange}
            theme="light"
            options={{
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on'
            }}
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          {status}
        </div>
      </div>
    </div>
  );
};

export default CodePage;