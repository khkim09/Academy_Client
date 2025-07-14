/*
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Layout from "./components/Layout";
import Attendance from "./components/Attendance";
import ScoreInput from "./components/ScoreInput";
import ViewScores from "./components/ViewScores";
import WrongNote from "./components/WrongNote";

function App() {
    return (
        <Router>
            <Layout>
                <Switch>
                    <Route path="/attendance" component={Attendance} />
                    <Route path="/input" component={ScoreInput} />
                    <Route path="/view" component={ViewScores} />
                    <Route path="/wrongnote" component={WrongNote} />
                    <Route path="/" component={Attendance} />{" "}
                    { // 기본 페이지
                    }
                </Switch>
            </Layout>
        </Router>
    );
}

export default App;
*/

// React 앱 메인

// client/src/App.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [students, setStudents] = useState([]);
    const [newStudent, setNewStudent] = useState({
        name: '',
        phone: '',
        school: '',
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (error) {
            console.error('학생 데이터를 불러오는 중 오류 발생:', error);
        }
    };

    const handleInputChange = (e) => {
        setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
    };

    const addStudent = async () => {
        const { name, phone, school } = newStudent;
        if (!name || !phone || !school)
            return alert('모든 정보를 입력해주세요.');

        try {
            await axios.post('/api/students', newStudent);
            setNewStudent({ name: '', phone: '', school: '' });
            fetchStudents(); // 새로고침
        } catch (error) {
            console.error('학생 추가 중 오류 발생:', error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>학생 목록</h1>
            <ul>
                {students.map((student, idx) => (
                    <li key={idx}>
                        {student.name} - {student.phone} - {student.school}
                    </li>
                ))}
            </ul>

            <h2>학생 추가</h2>
            <input
                type="text"
                name="name"
                placeholder="이름"
                value={newStudent.name}
                onChange={handleInputChange}
            />
            <input
                type="text"
                name="phone"
                placeholder="전화번호"
                value={newStudent.phone}
                onChange={handleInputChange}
            />
            <input
                type="text"
                name="school"
                placeholder="학교"
                value={newStudent.school}
                onChange={handleInputChange}
            />
            <button onClick={addStudent}>추가</button>
        </div>
    );
}

export default App;
