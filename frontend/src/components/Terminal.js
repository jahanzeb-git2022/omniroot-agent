/**
 * Terminal component for displaying and interacting with a shell.
 */
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import axios from 'axios';

const Terminal = ({ sessionId, workflowId }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize terminal
    if (!xtermRef.current) {
      // Create terminal instance
      xtermRef.current = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#f0f0f0',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#d0d0d0',
          brightBlack: '#808080',
          brightRed: '#ff5370',
          brightGreen: '#c3e88d',
          brightYellow: '#ffcb6b',
          brightBlue: '#82aaff',
          brightMagenta: '#c792ea',
          brightCyan: '#89ddff',
          brightWhite: '#ffffff'
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        scrollback: 1000,
        allowTransparency: true
      });

      // Create fit addon
      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);

      // Open terminal
      xtermRef.current.open(terminalRef.current);
      fitAddonRef.current.fit();

      // Welcome message
      xtermRef.current.writeln('Terminal initialized. Type commands to interact with the system.');
      xtermRef.current.writeln('');
      xtermRef.current.write('$ ');

      // Handle user input
      let commandBuffer = '';
      xtermRef.current.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter key
          xtermRef.current.writeln('');
          if (commandBuffer.trim()) {
            executeCommand(commandBuffer);
          } else {
            xtermRef.current.write('$ ');
          }
          commandBuffer = '';
        } else if (domEvent.keyCode === 8) { // Backspace
          if (commandBuffer.length > 0) {
            commandBuffer = commandBuffer.substring(0, commandBuffer.length - 1);
            xtermRef.current.write('\b \b');
          }
        } else if (printable) {
          commandBuffer += key;
          xtermRef.current.write(key);
        }
      });

      // Handle resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (xtermRef.current) {
          xtermRef.current.dispose();
        }
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    }
  }, []);

  // Execute command via API
  const executeCommand = async (command) => {
    try {
      xtermRef.current.writeln(`Executing: ${command}`);
      
      const response = await axios.post('http://localhost:5000/api/shell', {
        command,
        session_id: sessionId,
        workflow_id: workflowId
      });
      
      // The shell endpoint returns exit_code, stdout, and stderr
      if (response.data.exit_code === 0) {
        if (response.data.stdout) {
          xtermRef.current.writeln(response.data.stdout);
        }
        if (response.data.stderr) {
          xtermRef.current.writeln(response.data.stderr);
        }
      } else {
        if (response.data.stdout) {
          xtermRef.current.writeln(response.data.stdout);
        }
        if (response.data.stderr) {
          xtermRef.current.writeln(`Error: ${response.data.stderr}`);
        } else {
          xtermRef.current.writeln(`Command failed with exit code ${response.data.exit_code}`);
        }
      }
    } catch (error) {
      console.error('Error executing command:', error);
      xtermRef.current.writeln(`Error: ${error.message || 'Failed to execute command'}`);
    }
    
    xtermRef.current.write('$ ');
  };

  return (
    <div className="h-full w-full bg-gray-900 rounded-md overflow-hidden">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
};

export default Terminal;