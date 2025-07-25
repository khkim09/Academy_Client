// 프론트 코드
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import { useToast } from '../../contexts/ToastContext';
import './AttendancePage.css';

const AttendancePage = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('roster');
    const [roster, setRoster] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundStudents, setFoundStudents] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const { refreshKey } = useDataRefresh();
    const { showToast } = useToast();

    const fetchClasses = useCallback(() => {
        api.get(`/api/attendance/classes`)
            .then(res => {
                const classList = ['전체 분반', ...res.data];
                setClasses(classList);
                if (!classList.includes(selectedClass)) {
                    setSelectedClass('전체 분반');
                }
            })
            .catch(err => console.error('분반 목록 로딩 실패:', err));
    }, [selectedClass]);

    useEffect(fetchClasses, [refreshKey, fetchClasses]);

    const fetchAttendanceData = useCallback(() => {
        if (!selectedClass || !selectedDate) return;
        setIsLoading(true);
        api.get(`/api/attendance/classes`, { params: { class_name: selectedClass, date: selectedDate } })
            .then(res => {
                setRoster(res.data.map(record => ({
                    id: `${record.class_name}-${record.phone}`, name: record.student_name,
                    phone: record.phone, school: record.school,
                    className: record.class_name, isPresent: record.status === 'O'
                })));
            })
            .catch(err => console.error('출결 정보 로딩 실패:', err))
            .finally(() => setIsLoading(false));
    }, [selectedClass, selectedDate]);

    useEffect(() => {
        if (selectedClass === '전체 분반' && viewMode === 'history' && !selectedStudentInfo)
            return;
        fetchAttendanceData();
    }, [fetchAttendanceData, refreshKey]);

    const handleSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setHighlightedIndex(-1);
        if (query.length > 0) {
            api.get(`/api/attendance/classes`,
                { params: { name: query } })
                .then(res => setFoundStudents(res.data));
        } else {
            setFoundStudents([]);
            setSelectedStudentInfo(null);
            setHistory([]);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (foundStudents.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < foundStudents.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex > -1) {
                handleSelectStudent(foundStudents[highlightedIndex]);
            } else if (foundStudents.length > 0) {
                // Enter를 눌렀는데 하이라이트 된 게 없으면 첫번째 항목 선택
                handleSelectStudent(foundStudents[0]);
            }
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (foundStudents.length > 0) {
            const indexToSelect = highlightedIndex > -1 ? highlightedIndex : 0;
            handleSelectStudent(foundStudents[indexToSelect]);
        }
    };

    const handleSelectStudent = async (student) => {
        setFoundStudents([]);
        setSearchQuery(student.student_name);
        setSelectedStudentInfo(student);
        setViewMode('history');
        setIsLoading(true);
        try {
            const res = await api.get('/api/attendance/student-history', { params: { phone: student.phone } });
            setHistory(res.data);
        } catch (err) { alert('학생 출결 기록 로딩 실패'); }
        finally { setIsLoading(false); }
    };

    const handleClassChange = (e) => {
        setSelectedClass(e.target.value);
        setViewMode('roster');
        setSelectedStudentInfo(null);
        setSearchQuery('');
        setFoundStudents([]);
    };

    const toggleAttendance = (id) => setRoster(roster.map(s => s.id === id ? { ...s, isPresent: !s.isPresent } : s));
    const markAllPresent = () => setRoster(roster.map(s => ({ ...s, isPresent: true })));

    const handleSave = async () => {
        const records = roster.map(s => ({
            class_name: s.className,
            student_name: s.name,
            phone: s.phone,
            date: selectedDate,
            status: s.isPresent ? 'O' : 'X'
        }));
        try {
            await api.post('/api/attendance/save', { records });
            showToast('출결 정보가 성공적으로 저장되었습니다!', 'success');
        } catch (err) {
            const errorMessage = `저장 실패: ${err.response?.data?.error || err.message}`;
            showToast(errorMessage, 'error');
        }
    };

    const attendanceStats = useMemo(() => {
        const total = roster.length;
        const present = roster.filter(s => s.isPresent).length;
        const absent = total - present;
        const absentStudents = roster.filter(s => !s.isPresent);
        return { total, present, absent, absentStudents };
    }, [roster]);

    const isAllClassesView = selectedClass === '전체 분반';

    const renderLeftPanel = () => {
        const tableHeaders = isAllClassesView
            ? ['번호', '분반', '이름', '전화번호', '학교', '출결']
            : ['번호', '이름', '전화번호', '학교', '출결'];

        return (
            <div className="table-wrapper">
                <table className="attendance-table">
                    <thead><tr>{tableHeaders.map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={tableHeaders.length}>로딩 중...</td></tr>)
                            : roster.length > 0 ? (roster.map((student, idx) => (
                                <tr key={student.id} className={!student.isPresent ? 'status-absent' : ''}>
                                    <td>{idx + 1}</td>
                                    {isAllClassesView && <td>{student.className}</td>}
                                    <td>{student.name}</td><td>{student.phone}</td><td>{student.school}</td>
                                    <td><input type="checkbox" checked={student.isPresent} onChange={() => toggleAttendance(student.id)} disabled={isAllClassesView} /></td>
                                </tr>
                            )))
                                : (<tr><td colSpan={tableHeaders.length}>학생 데이터가 없습니다.</td></tr>)}
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
                    <form onSubmit={handleSearchSubmit}>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="학생 이름으로 검색..."
                                value={searchQuery}
                                onChange={handleSearchInputChange}
                                onKeyDown={handleSearchKeyDown}
                            />
                            {foundStudents.length > 0 && (
                                <ul className="search-results">
                                    {foundStudents.map((s, i) => (
                                        <li key={s.phone} className={i === highlightedIndex ? 'highlighted' : ''} onMouseDown={() => handleSelectStudent(s)}>
                                            {s.student_name} ({s.class_name})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button type="submit">검색</button>
                    </form>
                    {selectedStudentInfo && (
                        <div className="selected-student-info">
                            <p><span>이름</span>: {selectedStudentInfo.student_name}</p>
                            <p><span>분반</span>: {selectedStudentInfo.class_name}</p>
                            <p><span>연락처</span>: {selectedStudentInfo.phone}</p>
                            <p><span>학교</span>: {selectedStudentInfo.school}</p>
                        </div>
                    )}
                    {viewMode === 'history' && (
                        <div className="table-wrapper">
                            <table className="attendance-table">
                                <thead><tr><th>날짜</th><th>분반</th><th>출결</th></tr></thead>
                                <tbody>
                                    {isLoading ? (<tr><td colSpan="3">기록 로딩 중...</td></tr>)
                                        : history.length > 0 ? (history.map((record, index) => (
                                            <tr key={index}>
                                                <td>{new Date(record.date).toLocaleDateString()}</td>
                                                <td>{record.class_name}</td>
                                                <td>{record.status}</td>
                                            </tr>
                                        )))
                                            : (<tr><td colSpan="3">출결 기록이 없습니다.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }
        return (
            <>
                <div className="stats-row">
                    <div>총원<div className="count">{attendanceStats.total}</div></div>
                    <div>출석<div className="count" style={{ color: '#2980b9' }}>{attendanceStats.present}</div></div>
                    <div>결석<div className="count" style={{ color: '#c0392b' }}>{attendanceStats.absent}</div></div>
                </div>
                <div className="absent-list-box">
                    <div className="absent-list-title">결석자 명단</div>
                    <div className="absent-list-content">
                        {attendanceStats.absentStudents.length > 0 ? (
                            attendanceStats.absentStudents.map(s => <div key={s.id} className="absent-row"><span>{s.name}</span><span>{s.phone}</span></div>)
                        ) : (<p>결석자가 없습니다.</p>)}
                    </div>
                </div>
                <div className="button-row">
                    <button onClick={markAllPresent} className="all-present-btn">일괄 출석</button>
                    <button onClick={handleSave} className="save-btn">저장</button>
                </div>
            </>
        );
    };

    return (
        <div className="attendance-container">
            <div className="attendance-left">
                {renderLeftPanel()}
            </div>
            <div className="attendance-right">
                <div className="class-controls">
                    <select value={selectedClass} onChange={handleClassChange}>
                        {classes.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                {renderRightPanel()}
            </div>
        </div>
    );
};

export default AttendancePage;
