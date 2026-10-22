import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

try {
  if ('serviceWorker' in navigator) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true });
    }).catch(() => {});
  }
} catch {
  // Service worker não suportado ou bloqueado no webview nativo
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
