import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TabContext = createContext();

export const useTabs = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
    // 앱 시작 시 '학사 관리' 탭을 기본으로 열어둡니다.
    const [tabs, setTabs] = useState([{ id: 'attendance', title: '학사 관리', path: '/attendance' }]);
    const [activeTabId, setActiveTabId] = useState('attendance');
    const navigate = useNavigate();

    const openTab = useCallback((tabInfo) => {
        if (!tabs.some(tab => tab.id === tabInfo.id)) {
            setTabs(prevTabs => [...prevTabs, tabInfo]);
        }
        setActiveTabId(tabInfo.id);
        navigate(tabInfo.path);
    }, [tabs, navigate]);

    const closeTab = (tabIdToClose) => {
        const tabIndex = tabs.findIndex(tab => tab.id === tabIdToClose);
        const newTabs = tabs.filter(tab => tab.id !== tabIdToClose);

        if (tabIdToClose === activeTabId) {
            let nextActiveId = '';
            if (newTabs.length > 0) {
                // 닫은 탭의 바로 이전 탭을 활성화, 없으면 첫 번째 탭을 활성화
                const nextActiveIndex = Math.max(0, tabIndex - 1);
                nextActiveId = newTabs[nextActiveIndex].id;
            }
            setActiveTabId(nextActiveId);
            // URL도 함께 이동시킵니다. 탭이 없으면 기본 경로로 갑니다.
            const nextActiveTab = newTabs.find(t => t.id === nextActiveId);
            navigate(nextActiveTab ? nextActiveTab.path : '/');
        }
        setTabs(newTabs);
    };

    const setActiveTab = (tabId) => {
        setActiveTabId(tabId);
        const targetTab = tabs.find(tab => tab.id === tabId);
        if (targetTab) navigate(targetTab.path);
    }

    const value = { tabs, activeTabId, openTab, closeTab, setActiveTab };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
};
