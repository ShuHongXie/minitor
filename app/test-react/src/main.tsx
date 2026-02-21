import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@minitrack/react';
import './index.css';
import App from './App.tsx';

const monitorConfig = {
  appId: '38138f75-380c-4374-9fd8-520ff3a0a0a3',
  reportUrl: '/api/monitor/report',
  userId: 'test-user-001',
  environment: 'development',
  senderConfig: {
    batchSize: 3,
    sampleRate: 1,
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary options={monitorConfig} fallback={<div>Something went wrong</div>}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
