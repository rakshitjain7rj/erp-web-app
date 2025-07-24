import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTester = () => {
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000');
  const [endpoint, setEndpoint] = useState('/api/test');
  const [testUrl, setTestUrl] = useState('http://localhost:5000/api/test');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Combine base URL and endpoint, ensuring no double slashes
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    setTestUrl(`${base}${path}`);
  }, [baseUrl, endpoint]);

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await axios.get(testUrl);
      setTestResult(response.data);
      console.log('Test endpoint response:', response.data);
    } catch (err: any) {
      console.error('Error testing endpoint:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">API Endpoint Tester</h2>
      
      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="flex">
          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-r-0 rounded-l border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">Base URL</span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="http://localhost:5000"
          />
        </div>
        <div className="flex">
          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-r-0 rounded-l border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">Endpoint</span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="/api/test"
          />
        </div>
        <div className="flex items-center">
          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-r-0 rounded-l border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">Full URL</span>
          <div className="flex-grow px-3 py-2 border bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
            {testUrl}
          </div>
          <button
            onClick={testEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Testing...' : 'Test'}
          </button>
        </div>
      </div>
      
      <div className="mt-3">
        <p className="text-sm mb-1 text-gray-600 dark:text-gray-400">Test URLs:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEndpoint('/api/test')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
          >
            Test
          </button>
          <button
            onClick={() => setEndpoint('/api/machines')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
          >
            Machines
          </button>
          <button
            onClick={() => setEndpoint('/api/machines/performance')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
          >
            Performance
          </button>
          <button
            onClick={() => setEndpoint('/api/machines/status')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
          >
            Status
          </button>
          <button
            onClick={() => setEndpoint('/api/dashboard/stats')}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
          >
            Dashboard
          </button>
        </div>
        
        <div className="mt-2">
          <p className="text-sm mb-1 text-gray-600 dark:text-gray-400">Common Base URLs:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBaseUrl('http://localhost:5000')}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
            >
              localhost:5000
            </button>
            <button
              onClick={() => setBaseUrl('http://localhost:5000/api')}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
            >
              localhost:5000/api
            </button>
            <button
              onClick={() => setBaseUrl(window.location.origin)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
            >
              Current Origin
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {testResult && (
        <div className="mt-4">
          <p className="font-medium mb-2">Response:</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-60 text-xs">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTester;
