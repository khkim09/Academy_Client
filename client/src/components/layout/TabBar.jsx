import React from 'react';
import './MainLayout.css';

function TabBar({ tabs, activeTab, onTabClick, onTabClose }) {
    return (
        <div className="tab-bar">
            {tabs.map((tab) => (
                <div
                    key={tab}
                    className={`tab-item ${tab === activeTab ? 'active' : ''}`}
                    onClick={() => onTabClick(tab)}
                >
                    {tab}
                    <button className="close-btn" onClick={(e) => {
                        e.stopPropagation(); // 탭 클릭 이벤트 막기
                        onTabClose(tab);
                    }}>×</button>
                </div>
            ))}
        </div>
    );
}

export default TabBar;
