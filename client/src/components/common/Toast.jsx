import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import './Toast.css';

const Toast = () => {
    const { toast, hideToast } = useToast();

    if (!toast) {
        return null;
    }

    return (
        <div className={`toast-container ${toast.type} show`}>
            <p>{toast.message}</p>
            <button onClick={hideToast}>&times;</button>
        </div>
    );
};

export default Toast;
