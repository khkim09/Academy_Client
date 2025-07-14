// client/src/components/layout/ContentPanel.jsx
import React from 'react';
import AttendancePage from '../../screens/AttendancePage';
import ScoreInputPage from '../../screens/ScoreInputPage';
import ScoreViewPage from '../../screens/ScoreViewPage';
import WrongAnswerNotePage from '../../screens/WrongAnswerNotePage';

const ContentPanel = ({ activeTab }) => {
    // 탭 이름에 따라 해당 컴포넌트 렌더링
    const renderContent = () => {
        switch (activeTab) {
            case '학사관리':
                return <AttendancePage />;
            case '성적입력':
                return <ScoreInputPage />;
            case '성적조회':
                return <ScoreViewPage />;
            case '오답노트':
                return <WrongAnswerNotePage />;
            default:
                return <div>페이지를 선택해주세요.</div>;
        }
    };

    return (
        <div className="content-panel">
            {renderContent()}
        </div>
    );
};

export default ContentPanel;
