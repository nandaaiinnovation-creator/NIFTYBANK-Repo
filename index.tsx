import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './src/App';
import { BrokerProvider } from './src/contexts/BrokerContext';

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