import React, { createContext, useState, useContext, useCallback } from 'react';

// 1. Context 생성
const ToastContext = createContext();

// 2. 다른 컴포넌트에서 쉽게 사용할 수 있도록 Custom Hook 생성
export const useToast = () => {
    return useContext(ToastContext);
};

// 3. Context Provider 생성 (알림 상태와 함수를 자식들에게 제공)
export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        // 3초 후에 자동으로 알림을 사라지게 함
        setTimeout(() => {
            setToast(null);
        }, 3000);
    }, []);

    const hideToast = () => {
        setToast(null);
    };

    const value = { toast, showToast, hideToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};
