import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Simple App Test</h1>
      <p>If you can see this, React is working properly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h3>DOM Test</h3>
        <button onClick={() => {
          const div = document.createElement('div');
          div.textContent = 'Dynamic element created';
          div.style.background = '#e0ffe0';
          div.style.padding = '5px';
          div.style.margin = '5px 0';
          document.body.appendChild(div);
          setTimeout(() => document.body.removeChild(div), 2000);
        }}>
          Test appendChild
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;
