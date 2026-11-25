import React, { createContext, useContext, useEffect, useState } from 'react';
import { pages } from './content.js';
import { home, services, audiences, settings } from './home-content.js';
export const defaults = {home, services, audiences, settings, pages, posts: []};
const ContentContext = createContext(defaults);
export const useContent = () => useContext(ContentContext);
export function ContentProvider({children, initialContent}) {
  const [content, setContent] = useState(initialContent || defaults);
  useEffect(() => { const controller = new AbortController(); fetch('/api/content', {signal:controller.signal}).then(r => r.ok ? r.json() : null).then(data => { if(data) setContent(data); }).catch(()=>{}); return () => controller.abort(); }, []);
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
