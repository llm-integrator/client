import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { consumeOAuthSessionFromHash } from '@/shared/api';
import { AppProviders } from './providers/AppProviders';
import { App } from './App';
import './styles/global.css';

consumeOAuthSessionFromHash();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
