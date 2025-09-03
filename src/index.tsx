import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrokerProvider } from './contexts/BrokerContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrokerProvider>
      <App />
    </BrokerProvider>
  </React.StrictMode>
);
