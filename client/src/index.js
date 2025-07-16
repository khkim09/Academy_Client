import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { TabProvider } from './contexts/TabContext'; // [추가]

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <TabProvider> {/* [추가] TabProvider가 ToastProvider를 감싸도 무관합니다. */}
                <ToastProvider>
                    <App />
                </ToastProvider>
            </TabProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();
