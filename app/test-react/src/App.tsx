import { useState } from 'react';
import { useWebVitals } from '@minitrack/react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

const ThrowError = () => {
  throw new Error('This is a test error from React component');
};

function App() {
  const [count, setCount] = useState(0);
  const [shouldThrow, setShouldThrow] = useState(false);

  // 初始化性能指标采集
  useWebVitals({
    appId: '38138f75-380c-4374-9fd8-520ff3a0a0a3',
    reportUrl: '/api/monitor/report',
    buildVersion: '1.0.0',
    environment: 'development',
  });

  if (shouldThrow) {
    return <ThrowError />;
  }

  const handleJsError = () => {
    throw new Error('This is a standard JS error');
  };

  const handlePromiseError = () => {
    Promise.reject(new Error('This is a promise rejection error'));
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button onClick={() => setShouldThrow(true)}>Trigger React Error</button>
          <button onClick={handleJsError}>Trigger JS Error</button>
          <button onClick={handlePromiseError}>Trigger Promise Error</button>
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
