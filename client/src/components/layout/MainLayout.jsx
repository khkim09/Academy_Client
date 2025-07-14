// src/components/layout/MainLayout.jsx

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import '../layout/MainLayout.css'; // ✅ 올바른 CSS 적용

import AttendancePage from '../screens/AttendancePage';
import ScoreInputPage from '../screens/ScoreInputPage';
import ScoreViewPage from '../screens/ScoreViewPage';
import WrongAnswerNotePage from '../screens/WrongAnswerNotePage';

// 메뉴 이름과 해당 컴포넌트 매핑
const MENU_COMPONENTS = {
    학사관리: AttendancePage,
    성적입력: ScoreInputPage,
    성적조회: ScoreViewPage,
    오답노트: WrongAnswerNotePage,
};

function MainLayout() {
    const [tabs, setTabs] = useState([]); // 현재 열린 탭 목록
    const [activeTab, setActiveTab] = useState(null); // 현재 활성화된 탭

    // 사이드바 메뉴 클릭 시 탭 추가 및 활성화
    const handleMenuClick = (menu) => {
        if (!tabs.includes(menu)) {
            setTabs([...tabs, menu]);
        }
        setActiveTab(menu);
    };

    // 탭 클릭 시 활성화
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // 탭 닫기
    const handleTabClose = (tab) => {
        const newTabs = tabs.filter((t) => t !== tab);
        setTabs(newTabs);
        if (activeTab === tab) {
            setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
        }
    };

    const ActiveComponent = activeTab ? MENU_COMPONENTS[activeTab] : null;

    return (
        <div className="main-layout">
            <Sidebar onMenuClick={handleMenuClick} />
            <div className="main-content">
                <TabBar
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                />
                <div className="content-area">
                    {ActiveComponent ? <ActiveComponent /> : <div className="empty-tab">탭을 선택해주세요.</div>}
                </div>
            </div>
        </div>
    );
}

export default MainLayout;
