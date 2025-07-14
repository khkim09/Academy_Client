import React from 'react';
import './MainLayout.css';

function Sidebar({ onMenuClick }) {
    const menuItems = ['학사관리', '성적입력', '성적조회', '오답노트'];

    return (
        <div className="sidebar">
            <h2 className="sidebar-title">AcademySystem</h2>
            <ul className="menu-list">
                {menuItems.map((item) => (
                    <li key={item} className="menu-item" onClick={() => onMenuClick(item)}>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Sidebar;
