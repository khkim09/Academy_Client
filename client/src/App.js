import React from 'react';
import { Routes, Route } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import RegistrationPage from './components/screens/RegistrationPage';
import AttendancePage from './components/screens/AttendancePage';
import ScorePage from './components/screens/ScoreInputPage';

import Toast from './components/common/Toast';

import './App.css';

function App() {
    return (
        <>
            <Toast /> {/* [추가] 앱 전체에 알림을 표시할 컴포넌트 */}
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<AttendancePage />} />
                    <Route path="registration" element={<RegistrationPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="scores" element={<ScorePage />} />
                </Route>
            </Routes>
            {/* <Toaster position="bottom-center" /> [삭제] */}
        </>
    );
}

export default App;
