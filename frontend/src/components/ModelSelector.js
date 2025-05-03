/**
 * Model selector component for choosing and configuring the LLM.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModelSelector = () => {
  const [config, setConfig] = useState({
    provider: 'huggingface',
    model_name: 'Qwen/Qwen3-235B-A22B',
    api_key: '',
    model_kwargs: {
      temperature: 0.2,
      max_length: 4096,
      top_p: 0.9
    }
  });
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  // Load available providers and models
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/model/providers');
        setProviders(response.data.providers);
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };

    fetchProviders();
  }, []);

  // Load current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/model/config');
        setConfig(prev => ({
          ...prev,
          provider: response.data.provider,
          model_name: response.data.model_name,
          model_kwargs: response.data.model_kwargs
        }));
        
        // Check if the model is in the predefined list
        const provider = providers.find(p => p.name === response.data.provider);
        if (provider && !provider.models.includes(response.data.model_name)) {
          setCustomModel(true);
        }
      } catch (error) {
        console.error('Error fetching model config:', error);
        setStatus('Error loading configuration');
      }
    };

    if (providers.length > 0) {
      fetchConfig();
    }
  }, [providers]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Updating model...');

    try {
      const response = await axios.post('http://localhost:5000/api/model/config', config);
      setStatus(response.data.message);
    } catch (error) {
      console.error('Error updating model:', error);
      setStatus(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (model_kwargs)
      const [parent, child] = name.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: name.includes('temperature') || name.includes('top_p') 
            ? parseFloat(value) 
            : name.includes('max') 
              ? parseInt(value, 10) 
              : value
        }
      }));
    } else if (name === 'provider') {
      // Handle provider change
      setConfig(prev => ({
        ...prev,
        provider: value,
        // Reset model name when provider changes
        model_name: providers.find(p => p.name === value)?.models[0] || ''
      }));
      setCustomModel(false);
    } else if (name === 'model_name') {
      // Handle model name change
      if (value === 'custom') {
        setCustomModel(true);
        setConfig(prev => ({ ...prev, model_name: '' }));
      } else {
        setConfig(prev => ({ ...prev, model_name: value }));
      }
    } else {
      // Handle other properties
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  // Get models for the selected provider
  const getModelsForProvider = () => {
    const provider = providers.find(p => p.name === config.provider);
    return provider ? provider.models : [];
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Model Configuration</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            name="provider"
            value={config.provider}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            {providers.map(provider => (
              <option key={provider.name} value={provider.name}>
                {provider.display_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Name
          </label>
          {!customModel ? (
            <div className="flex">
              <select
                name="model_name"
                value={config.model_name}
                onChange={handleChange}
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              >
                {getModelsForProvider().map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCustomModel(true)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-r-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex">
              <input
                type="text"
                name="model_name"
                value={config.model_name}
                onChange={handleChange}
                placeholder="Enter custom model name"
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomModel(false);
                  setConfig(prev => ({
                    ...prev,
                    model_name: getModelsForProvider()[0] || ''
                  }));
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-r-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                Predefined
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            name="api_key"
            value={config.api_key}
            onChange={handleChange}
            placeholder="Enter your API key"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key is only stored in memory and never persisted to disk.
          </p>
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Advanced Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  name="model_kwargs.temperature"
                  value={config.model_kwargs.temperature}
                  onChange={handleChange}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls randomness (0-2)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  name="model_kwargs.max_length"
                  value={config.model_kwargs.max_length}
                  onChange={handleChange}
                  min="1"
                  max="32000"
                  step="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum tokens to generate
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Top P
                </label>
                <input
                  type="number"
                  name="model_kwargs.top_p"
                  value={config.model_kwargs.top_p}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nucleus sampling parameter (0-1)
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Model'}
          </button>
        </div>
      </form>
      
      {status && (
        <div className={`mt-4 p-3 rounded-md ${status.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;