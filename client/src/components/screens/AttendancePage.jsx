import React, { useState, useEffect } from 'react';
import './AttendancePage.css';

const AttendancePage = () => {
    const [selectedClass, setSelectedClass] = useState('일 대찬 1400-1700');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [students, setStudents] = useState([]);

    const dummyStudentList = [
        { id: 1, name: '김결석', phone: '010-1234-5678', school: '결석고', isPresent: true },
        { id: 2, name: '이학생', phone: '010-2222-3333', school: '출석중', isPresent: true },
        { id: 3, name: '박결석', phone: '010-9999-8888', school: '결석중', isPresent: false },
    ];

    useEffect(() => {
        setStudents(dummyStudentList);
    }, [selectedClass]);

    const toggleAttendance = (id) => {
        const updated = students.map(student =>
            student.id === id ? { ...student, isPresent: !student.isPresent } : student
        );
        setStudents(updated);
    };

    const markAllPresent = () => {
        const updated = students.map(student => ({ ...student, isPresent: true }));
        setStudents(updated);
    };

    const handleSave = async () => {
        const attendanceRecords = students.map(s => ({
            class_name: selectedClass,
            date: selectedDate,
            student_name: s.name,
            phone: s.phone,
            school: s.school,
            status: s.isPresent ? '출석' : '결석'
        }));

        try {
            const response = await fetch('/api/attendance/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: attendanceRecords })
            });

            if (!response.ok) throw new Error('저장 실패');

            alert('출결 정보 저장 완료!');
        } catch (err) {
            console.error('저장 오류:', err);
            alert('저장 중 오류 발생!');
        }
    };

    const total = students.length;
    const present = students.filter(s => s.isPresent).length;
    const absent = total - present;
    const absentStudents = students.filter(s => !s.isPresent);

    return (
        <div className="attendance-container">
            <div className="attendance-left">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>이름</th>
                            <th>전화번호</th>
                            <th>학교</th>
                            <th>출결</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <tr key={student.id}>
                                <td>{idx + 1}</td>
                                <td>{student.name}</td>
                                <td>{student.phone}</td>
                                <td>{student.school}</td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={student.isPresent}
                                        onChange={() => toggleAttendance(student.id)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="attendance-right">
                <div className="top-row">
                    <label>
                        분반 선택
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option>일 대찬 1400-1700</option>
                            <option>수 민철 1600-1800</option>
                            <option>토 철수 1000-1300</option>
                        </select>
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                <div className="stats-row">
                    <div>
                        <div>총원</div>
                        <div className="count">{total}</div>
                    </div>
                    <div>
                        <div>출석</div>
                        <div className="count">{present}</div>
                    </div>
                    <div>
                        <div>결석</div>
                        <div className="count">{absent}</div>
                    </div>
                </div>

                <div className="absent-list-box">
                    <div className="absent-list-title">결석자 목록</div>
                    <div className="absent-list-content">
                        {absentStudents.map(s => (
                            <div className="absent-row" key={s.id}>
                                <span>{s.name}</span>
                                <span>{s.phone}</span>
                                <span>{s.school}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="button-row">
                    <button onClick={markAllPresent}>일괄 출석</button>
                    <button onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
