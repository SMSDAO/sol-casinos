import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe PWA Service Worker registration for Vite dev/prod environments
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // Ignore SW register errors in dev
  });
}

createRoot(document.getElementById('root')!).render(<App />);
