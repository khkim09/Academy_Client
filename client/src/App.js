import React from 'react';
import { Routes, Route } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import RegistrationPage from './components/screens/RegistrationPage';
import AttendancePage from './components/screens/AttendancePage';
import ScorePage from './components/screens/ScoreInputPage';
import ScoreInquiryPage from './components/screens/ScoreInquiryPage';
import LectureAdminPage from './components/screens/LectureAdminPage';
import QuestionEditorPage from './components/screens/QuestionEditorPage';
import WrongAnswerNotePage from './components/screens/WrongAnswerNotePage';

import Toast from './components/common/Toast';

import './App.css';

function App() {
    return (
        <>
            <Toast />
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<AttendancePage />} />
                    <Route path="registration" element={<RegistrationPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="scores" element={<ScorePage />} />
                    <Route path="inquiry" elemeny={<ScoreInquiryPage />} />
                    <Route path="materials" element={<LectureAdminPage />} />
                    <Route path="editor/:materialId" element={<QuestionEditorPage />} />
                    <Route path="notes" element={<WrongAnswerNotePage />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
