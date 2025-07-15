// 프론트 코드
import React, { useState, useEffect, useMemo } from 'react';
import './AttendancePage.css';
import axios from 'axios';

const AttendancePage = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 분반 목록 불러오기
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await axios.get('/api/attendance/classes');
                setClasses(response.data);
                if (response.data.length > 0) {
                    setSelectedClass(response.data[0]); // 첫 번째 분반을 기본값으로 설정
                }
            } catch (error) {
                console.error('분반 목록 로딩 실패:', error);
                alert('분반 목록을 불러오는 데 실패했습니다.');
            }
        };
        fetchClasses();
    }, []);

    // 출결 데이터 불러오기
    useEffect(() => {
        if (!selectedClass || !selectedDate) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/attendance/get', {
                    params: {
                        class_name: selectedClass,
                        date: selectedDate
                    }
                });
                const loadedStudents = response.data.map((record, idx) => ({
                    id: idx + 1,
                    name: record.student_name,
                    phone: record.phone,
                    school: record.school,
                    isPresent: record.status === '출석'
                }));
                setStudents(loadedStudents);
            } catch (error) {
                console.error('출결 정보 로딩 실패:', error);
                alert('출결 정보를 불러오는 데 실패했습니다.');
                setStudents([]); // 오류 발생 시 학생 목록 비움
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedClass, selectedDate]);

    const toggleAttendance = (id) => {
        const updatedStudents = students.map(student =>
            student.id === id ? { ...student, isPresent: !student.isPresent } : student
        );
        setStudents(updatedStudents);
    };

    const markAllPresent = () => {
        const updatedStudents = students.map(student => ({ ...student, isPresent: true }));
        setStudents(updatedStudents);
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
            await axios.post('/api/attendance/save', { records: attendanceRecords });
            alert('출결 정보가 성공적으로 저장되었습니다!');
        } catch (err) {
            console.error('저장 오류:', err);
            alert(`저장 중 오류가 발생했습니다: ${err.response?.data?.error || err.message}`);
        }
    };

    // 출결 현황 계산
    const attendanceStats = useMemo(() => {
        const total = students.length;
        const present = students.filter(s => s.isPresent).length;
        const absent = total - present;
        const absentStudents = students.filter(s => !s.isPresent);
        return { total, present, absent, absentStudents };
    }, [students]);

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
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>로딩 중...</td></tr>
                        ) : students.length > 0 ? (
                            students.map((student, idx) => (
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
                            ))
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>해당 조건의 출결 데이터가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="attendance-right">
                <div className="top-row">
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ flex: 1 }}>
                        {classes.length > 0 ? (
                            classes.map(cls => <option key={cls} value={cls}>{cls}</option>)
                        ) : (
                            <option>불러올 분반 없음</option>
                        )}
                    </select>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="stats-row">
                    <div>총원<div className="count">{attendanceStats.total}</div></div>
                    <div>출석<div className="count">{attendanceStats.present}</div></div>
                    <div>결석<div className="count">{attendanceStats.absent}</div></div>
                </div>
                <div className="absent-list-box">
                    <div className="absent-list-title">결석자 목록</div>
                    <div className="absent-list-content">
                        {attendanceStats.absentStudents.length > 0 ? (
                            attendanceStats.absentStudents.map(student => (
                                <div key={student.id} className="absent-row">
                                    <span>{student.name}</span>
                                    <span>{student.school}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#888', paddingTop: '20px' }}>결석자가 없습니다.</div>
                        )}
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
