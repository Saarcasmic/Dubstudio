import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Logger } from './utils/logger';

// 1. Setup Global Error Listeners (catch errors outside React)
window.onerror = (message, source, lineno, colno, error) => {
  Logger.error('Global Script Error', error, { source, lineno, colno, message });
};

window.onunhandledrejection = (event) => {
  Logger.error('Unhandled Promise Rejection', event.reason);
};

// 2. Initial mount verification
const rootElement = document.getElementById('root');
if (!rootElement) {
  const msg = "Could not find root element to mount to";
  Logger.error(msg);
  throw new Error(msg);
}

Logger.info('Application Starting...');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);