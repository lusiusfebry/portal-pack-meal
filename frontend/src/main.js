import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
const rootEl = document.getElementById('root');
if (!rootEl) {
    throw new Error('Root element #root not found');
}
ReactDOM.createRoot(rootEl).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
