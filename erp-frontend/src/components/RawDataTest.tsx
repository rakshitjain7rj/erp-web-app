import React, { useEffect, useState } from 'react';

const RawDataTest = () => {
  const [rawData, setRawData] = useState('');
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const fetchRawData = async () => {
      try {
        setStatus('Fetching...');
        const response = await fetch('http://localhost:5000/api/parties/summary');
        const text = await response.text();
        setRawData(text);
        setStatus(`SUCCESS: Got response (${text.length} chars)`);
      } catch (error) {
        setStatus(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    fetchRawData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Raw Party Data Test</h1>
      <p><strong>Status:</strong> {status}</p>
      <h3>Raw Response:</h3>
      <textarea 
        value={rawData} 
        readOnly 
        style={{ 
          width: '100%', 
          height: '400px', 
          fontFamily: 'monospace',
          fontSize: '12px'
        }} 
      />
    </div>
  );
};

export default RawDataTest;
