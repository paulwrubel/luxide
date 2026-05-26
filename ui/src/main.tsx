import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initThemeMode } from 'flowbite-react';
import './index.css';
import App from './App.tsx';

// initialize flowbite-react's dark mode before React renders
//
// without this, all flowbite components default to light mode
initThemeMode({ mode: 'dark' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
