import React, { useEffect, useState } from 'react';

const SimplePartyTest = () => {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        setStatus('Fetching data...');
        const response = await fetch('http://localhost:5000/api/parties/summary');
        
        if (!response.ok) {
          setStatus(`ERROR: ${response.status} ${response.statusText}`);
          return;
        }
        
        const result = await response.json();
        setStatus(`SUCCESS: Got ${result.length} parties`);
        setData(result);      } catch (error) {
        setStatus(`FETCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Simple Party API Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      {data && (
        <div>
          <h3>Raw Data:</h3>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SimplePartyTest;
