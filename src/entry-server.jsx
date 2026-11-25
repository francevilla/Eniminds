import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './main.jsx';
import { ContentProvider } from './site-content.jsx';
export function render(path, content) { return renderToString(<ContentProvider initialContent={content}><App path={path}/></ContentProvider>); }
