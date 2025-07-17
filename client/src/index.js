import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { TabProvider } from './contexts/TabContext';
import { DataRefreshProvider } from './contexts/DataRefreshContext';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <TabProvider>
                <ToastProvider>
                    <DataRefreshProvider>
                        <App />
                    </DataRefreshProvider>
                </ToastProvider>
            </TabProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();
