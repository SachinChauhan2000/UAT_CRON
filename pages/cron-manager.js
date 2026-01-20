import { useState } from 'react';
import Head from 'next/head';

export default function CronManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('30min');
  const [logs, setLogs] = useState([]);

  const addLog = (text) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${text}`, ...prev].slice(0, 50));
  };

  const triggerCron = async (scheduleType) => {
    setLoading(true);
    setMessage('');
    addLog(`Starting ${scheduleType} job...`);
    
    try {
      const response = await fetch('/api/cron/hit-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduleType }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addLog(`${scheduleType} job completed successfully`);
        if (scheduleType === 'morning' && data.results) {
          data.results.forEach(result => {
            addLog(`URL: ${result.url} - ${result.status.toUpperCase()}`);
          });
        }
      } else {
        addLog(`Error: ${data.message || 'Unknown error'}`);
      }
      
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMsg = error.message || 'Failed to trigger cron job';
      addLog(`Error: ${errorMsg}`);
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: '30min', label: '30 Min Job' },
    { id: '60min', label: '60 Min Job' },
    { id: 'morning', label: 'Morning Batch' },
  ];

  return (
    <div className="container">
      <Head>
        <title>Cron Job Manager</title>
        <meta name="description" content="Manage your cron jobs" />
      </Head>

      <h1>Cron Job Manager</h1>
      
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        <div className="controls">
          <button 
            onClick={() => triggerCron(activeTab)}
            disabled={loading}
            className="run-button"
          >
            {loading ? 'Running...' : `Run ${activeTab} Job`}
          </button>
          
          <button 
            onClick={() => setLogs([])}
            className="clear-button"
          >
            Clear Logs
          </button>
        </div>

        <div className="results">
          <h3>Results:</h3>
          <pre>{message || 'No results yet. Click "Run" to start a job.'}</pre>
        </div>

        <div className="logs">
          <h3>Logs:</h3>
          <div className="log-container">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="log-entry">
                  {log}
                </div>
              ))
            ) : (
              <div className="no-logs">No logs yet. Run a job to see logs.</div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        h1 {
          color: #333;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        
        .tab {
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          border-bottom: none;
          position: relative;
          bottom: -1px;
        }
        
        .tab.active {
          background: white;
          border-bottom: 1px solid white;
          font-weight: bold;
        }
        
        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .run-button, .clear-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
        }
        
        .run-button {
          background-color: #4CAF50;
          color: white;
        }
        
        .run-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .clear-button {
          background-color: #f44336;
          color: white;
        }
        
        .results, .logs {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .results h3, .logs h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        pre {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #eee;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .log-container {
          max-height: 300px;
          overflow-y: auto;
          background: white;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 10px;
        }
        
        .log-entry {
          padding: 5px 0;
          border-bottom: 1px solid #f0f0f0;
          font-family: monospace;
          font-size: 14px;
        }
        
        .log-entry:last-child {
          border-bottom: none;
        }
        
        .no-logs {
          color: #999;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
