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

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await axios.get('/api/attendance/classes');
                const classList = ['전체 분반', ...response.data];
                setClasses(classList);
                setSelectedClass(classList[0]); // 기본으로 '전체 분반' 선택
            } catch (error) {
                console.error('분반 목록 로딩 실패:', error);
                alert('분반 목록을 불러오는 데 실패했습니다.');
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (!selectedClass || !selectedDate) return;

        const fetchAttendanceData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/attendance/get', {
                    params: { class_name: selectedClass, date: selectedDate }
                });
                const loadedStudents = response.data.map((record) => ({
                    id: `${record.class_name}-${record.phone}`, // 분반명+전화번호로 고유 키 생성
                    name: record.student_name,
                    phone: record.phone,
                    school: record.school,
                    className: record.class_name,
                    isPresent: record.status === '출석'
                }));
                setStudents(loadedStudents);
            } catch (error) {
                console.error('출결 정보 로딩 실패:', error);
                setStudents([]); // 오류 발생 시 목록 비우기
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendanceData();
    }, [selectedClass, selectedDate]);

    const toggleAttendance = (id) => {
        setStudents(students.map(s => s.id === id ? { ...s, isPresent: !s.isPresent } : s));
    };

    const markAllPresent = () => {
        setStudents(students.map(s => ({ ...s, isPresent: true })));
    };

    const handleSave = async () => {
        // [수정된 부분] 서버로 보낼 데이터를 더 간결하게 수정
        const records = students.map(s => ({
            class_name: s.className,
            date: selectedDate,
            student_name: s.name,
            phone: s.phone, // 식별자로 phone 사용
            status: s.isPresent ? '출석' : '결석'
        }));

        try {
            await axios.post('/api/attendance/save', { records });
            alert('출결 정보가 성공적으로 저장되었습니다!');
        } catch (err) {
            alert(`저장 실패: ${err.response?.data?.error || err.message}`);
        }
    };

    const attendanceStats = useMemo(() => {
        const total = students.length;
        const present = students.filter(s => s.isPresent).length;
        const absent = total - present;
        const absentStudents = students.filter(s => !s.isPresent);
        return { total, present, absent, absentStudents };
    }, [students]);

    const isAllClassesView = selectedClass === '전체 분반';

    return (
        <div className="attendance-container">
            <div className="attendance-left">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>번호</th>
                            {isAllClassesView && <th>분반</th>}
                            <th>이름</th>
                            <th>전화번호</th>
                            <th>학교</th>
                            <th>출결</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={isAllClassesView ? 6 : 5}>로딩 중...</td></tr>
                        ) : students.length > 0 ? (
                            students.map((student, idx) => (
                                <tr key={student.id}>
                                    <td>{idx + 1}</td>
                                    {isAllClassesView && <td>{student.className}</td>}
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
                            <tr><td colSpan={isAllClassesView ? 6 : 5}>학생 명단에 등록된 학생이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="attendance-right">
                <div className="class-controls">
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
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
                        {attendanceStats.absentStudents.map(s => (
                            <div key={s.id} className="absent-row">
                                <span>{s.name} {isAllClassesView && `(${s.className.split(' ')[1]})`}</span>
                                <span>{s.school}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="button-row">
                    <button onClick={markAllPresent} disabled={isAllClassesView}>일괄 출석</button>
                    <button onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
