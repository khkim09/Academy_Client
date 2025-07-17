// 프론트 코드
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import './AttendancePage.css';

// 동명이인 선택 팝업(모달) 컴포넌트
const SearchStudentModal = ({ students, onSelect, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>검색 결과</h2>
                <div className="modal-list">
                    {students.map((student, index) => (
                        <div key={index} className="modal-list-item" onClick={() => onSelect(student)}>
                            <span>{student.student_name}</span>
                            <span>{student.phone}</span>
                            <span>{student.school}</span>
                            <span>{student.class_name}</span>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="modal-close-btn">닫기</button>
            </div>
        </div>
    );
};

const AttendancePage = () => {
    // --- 상태 관리 (State) ---
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [isLoading, setIsLoading] = useState(false);

    // 뷰 모드 및 데이터 상태
    const [viewMode, setViewMode] = useState('roster'); // 'roster' | 'history'
    const [roster, setRoster] = useState([]); // 분반 명단
    const [history, setHistory] = useState([]); // 개인 출결 기록
    const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);

    // 검색 기능 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [foundStudents, setFoundStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 최신화 갱신 작업
    const { refreshKey } = useDataRefresh();

    // --- 데이터 로딩 (Hooks) ---
    useEffect(() => {
        axios.get('/api/attendance/classes')
            .then(res => {
                const classList = ['전체 분반', ...res.data];
                setClasses(classList);
                setSelectedClass('전체 분반');
            })
            .catch(err => alert('분반 목록 로딩 실패'));
    }, []);

    useEffect(() => {
        // 분반 선택이 바뀌면 항상 명단(roster) 뷰로 초기화
        setViewMode('roster');
        setSelectedStudentInfo(null);
        if (!selectedClass || !selectedDate)
            return;

        if (selectedClass !== '전체 분반' || viewMode === 'roster') {
            fetchRosterData();
        }
    }, [selectedClass, selectedDate, refreshKey]);

    const fetchRosterData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/attendance/get', {
                params: { class_name: selectedClass, date: selectedDate }
            });
            const loadedStudents = res.data.map(record => ({
                id: `${record.class_name}-${record.phone}`,
                name: record.student_name,
                phone: record.phone,
                school: record.school,
                className: record.class_name,
                isPresent: record.status === '출석'
            }));
            setRoster(loadedStudents);
        } catch (err) {
            alert('출결 정보 로딩 실패');
            setRoster([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 이벤트 핸들러 ---
    const handleSearch = async (e) => {
        e.preventDefault();

        // 빈 문자열도 검색 가능
        try {
            const res = await axios.get(
                '/api/attendance/search-students',
                { params: { name: searchQuery } }
            );
            if (res.data.length === 0) {
                alert('해당 이름의 학생을 찾을 수 없습니다.');
            } else if (res.data.length === 1) {
                handleSelectStudent(res.data[0]);
            } else {
                setFoundStudents(res.data);
                setIsModalOpen(true);
            }
        } catch (err) {
            alert('학생 검색 중 오류 발생');
        }
    };

    const handleSelectStudent = async (student) => {
        setIsModalOpen(false);
        setSelectedStudentInfo(student);
        setViewMode('history');
        setIsLoading(true);
        try {
            const res = await axios.get(
                '/api/attendance/student-history',
                { params: { phone: student.phone } }
            );
            setHistory(res.data);
        } catch (err) {
            alert('학생 출결 기록 로딩 실패');
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAttendance = (id) => {
        setRoster(roster.map(s => s.id === id ? { ...s, isPresent: !s.isPresent } : s));
    };

    const markAllPresent = () => {
        setRoster(roster.map(s => ({ ...s, isPresent: true })));
    };

    const handleSave = async () => {
        const records = roster.map(s => ({
            class_name: s.className,
            date: selectedDate,
            student_name: s.name,
            phone: s.phone,
            status: s.isPresent ? '출석' : '결석'
        }));
        try {
            await axios.post('/api/attendance/save', { records });
            alert('출결 정보가 성공적으로 저장되었습니다!');
        } catch (err) {
            alert(`저장 실패: ${err.response?.data?.error || err.message}`);
        }
    };

    // --- 렌더링 로직 ---
    const attendanceStats = useMemo(() => {
        const total = roster.length;
        const present = roster.filter(s => s.isPresent).length;
        const absent = total - present;
        const absentStudents = roster.filter(s => !s.isPresent);
        return { total, present, absent, absentStudents };
    }, [roster]);

    const isAllClassesView = selectedClass === '전체 분반';

    const renderLeftPanel = () => {
        if (viewMode === 'history') {
            return (
                <div className="table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>출결 상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="2">기록 로딩 중...</td></tr>
                            ) : history.length > 0 ? (
                                history.map((record, idx) => (
                                    <tr key={idx}>
                                        <td>{record.date}</td>
                                        <td className={record.status === '결석' ? 'status-absent' : ''}>{record.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2">출결 기록이 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }

        return (
            <div className="table-wrapper">
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
                        ) : roster.length > 0 ? (
                            roster.map((student, idx) => (
                                <tr key={student.id}>
                                    <td>{idx + 1}</td>
                                    {isAllClassesView && <td>{student.className}</td>}
                                    <td>{student.name}</td>
                                    <td>{student.phone}</td>
                                    <td>{student.school}</td>
                                    <td><input type="checkbox" checked={student.isPresent} onChange={() => toggleAttendance(student.id)} /></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={isAllClassesView ? 6 : 5}>학생 데이터가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderRightPanel = () => {
        if (isAllClassesView) {
            return (
                <div className="search-panel">
                    <h3>학생 검색</h3>
                    {selectedStudentInfo && (
                        <div className="selected-student-info">
                            <p><span>이름:</span> {selectedStudentInfo.student_name}</p>
                            <p><span>분반:</span> {selectedStudentInfo.class_name}</p>
                            <p><span>연락처:</span> {selectedStudentInfo.phone}</p>
                            <p><span>학교:</span> {selectedStudentInfo.school}</p>
                        </div>
                    )}
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="학생 이름을 입력하세요"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">검색</button>
                    </form>
                    <p className="search-guide">
                        검색 후 좌측 목록에서 해당 학생의 전체 출결 기록을 확인할 수 있습니다.
                    </p>
                </div>
            );
        }

        return (
            <>
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
                                <span>{s.name}</span>
                                <span>{s.school}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="button-row">
                    <button onClick={markAllPresent}>일괄 출석</button>
                    <button onClick={handleSave}>저장</button>
                </div>
            </>
        );
    };

    return (
        <>
            {
                isModalOpen && <SearchStudentModal
                    students={foundStudents}
                    onSelect={handleSelectStudent}
                    onClose={() => setIsModalOpen(false)} />
            }
            <div className="attendance-container">
                <div className="attendance-left">{renderLeftPanel()}</div>
                <div className="attendance-right">
                    <div className="class-controls">
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} disabled={viewMode === 'history'} />
                    </div>
                    {renderRightPanel()}
                </div>
            </div>
        </>
    );
};

export default AttendancePage;
