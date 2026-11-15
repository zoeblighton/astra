import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Order matters: tokens first, then global styles that use them.
import './styles/tokens.css';
import './styles/global.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
