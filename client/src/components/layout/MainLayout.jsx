import React from 'react';
import { useTabs } from '../../contexts/TabContext';
import './MainLayout.css';

import AttendancePage from '../screens/AttendancePage';
import ScoreInputPage from '../screens/ScoreInputPage';

// 페이지 컴포넌트를 미리 매핑해둡니다.
const pageComponents = {
    attendance: <AttendancePage />,
    scores: <ScoreInputPage />,
};

// 사이드바 메뉴 정보를 정의합니다.
const menuItems = [
    { id: 'attendance', title: '학사 관리', path: '/attendance' },
    { id: 'scores', title: '성적 입력', path: '/scores' },
];

const MainLayout = () => {
    const { tabs, activeTabId, openTab, closeTab, setActiveTab } = useTabs();

    return (
        <div className="main-layout">
            <aside className="sidebar">
                <div className="sidebar-header"><h2>ACADEMY</h2></div>
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <a key={item.id} onClick={() => openTab(item)} className={activeTabId === item.id ? 'active' : ''}>
                            {item.title}
                        </a>
                    ))}
                </nav>
            </aside>
            <main className="main-content">
                <header className="content-header">
                    <div className="tab-bar">
                        {tabs.map(tab => (
                            <div key={tab.id} className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <span>{tab.title}</span>
                                <button className="close-tab-btn" onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
                            </div>
                        ))}
                    </div>
                </header>
                <div className="page-wrapper">
                    {tabs.length === 0 ? (
                        <div className="no-tabs-placeholder">
                            <p>좌측 메뉴를 선택하여 작업을 시작하세요.</p>
                        </div>
                    ) : (
                        tabs.map(tab => (
                            <div key={tab.id} style={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%' }}>
                                {pageComponents[tab.id]}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
