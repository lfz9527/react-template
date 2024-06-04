import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'

const root = createRoot(document.getElementById('app'));
console.log(root)
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
