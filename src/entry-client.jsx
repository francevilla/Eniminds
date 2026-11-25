import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './main.jsx';
import { ContentProvider } from './site-content.jsx';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './style.css';

const root = document.getElementById('root');
let initialContent;
try { const el = document.getElementById('initial-content'); if (el) initialContent = JSON.parse(el.textContent); } catch {}
const app = <ContentProvider initialContent={initialContent}><App path={window.location.pathname} /></ContentProvider>;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
