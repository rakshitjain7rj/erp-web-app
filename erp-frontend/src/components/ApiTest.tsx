import React, { useState } from 'react';

const ApiTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDirectFetch = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing direct fetch to:', 'http://localhost:5000/api/parties/summary');
      const response = await fetch('http://localhost:5000/api/parties/summary');
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Direct fetch error:', error);
      if (error instanceof Error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult('Error: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const testPartyApi = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing party API import...');
      const { getAllPartiesSummary } = await import('../api/partyApi');
      console.log('📦 Party API imported successfully');
      
      const data = await getAllPartiesSummary();
      console.log('✅ Party API data:', data);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Party API error:', error);
      if (error instanceof Error) {
        setResult(`Party API Error: ${error.message}`);
      } else {
        setResult('Party API Error: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Direct Fetch'}
        </button>
        
        <button
          onClick={testPartyApi}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Party API'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Result:</h3>
        <pre className="whitespace-pre-wrap text-sm">{result || 'Click a button to test...'}</pre>
      </div>
    </div>
  );
};

export default ApiTest;
