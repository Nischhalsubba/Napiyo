import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './accessibility.css';
import './dark-contrast.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Napiyo could not find the application root.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Napiyo offline mode could not be enabled.', error);
    });
  });
}
