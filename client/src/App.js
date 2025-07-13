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

import React, { useEffect, useState } from "react";

function App() {
    const [students, setStudents] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [school, setSchool] = useState("");

    useEffect(() => {
        fetch("/api/students")
            .then((res) => res.json())
            .then((data) => setStudents(data))
            .catch((err) => console.error("불러오기 실패:", err));
    }, []);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        const newStudent = { name, phone, school };

        const res = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newStudent),
        });

        if (res.ok) {
            const result = await res.json();
            console.log("추가된 학생:", result);
            setStudents([...students, result]); // 화면 즉시 반영
            setName(""); setPhone(""); setSchool("");
        } else {
            console.error("추가 실패");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>학생 목록</h1>
            <ul>
                {students.map((s) => (
                    <li key={s.id}>
                        {s.name} - {s.phone} - {s.school}
                    </li>
                ))}
            </ul>

            <h2>학생 추가</h2>
            <form onSubmit={handleAddStudent}>
                <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
                <input placeholder="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input placeholder="학교" value={school} onChange={(e) => setSchool(e.target.value)} />
                <button type="submit">추가</button>
            </form>
        </div>
    );
}

export default App;
