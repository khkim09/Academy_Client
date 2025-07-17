import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import WrongQuestionsModal from '../common/WrongQuestionsModal';
import './ScoreInputPage.css';

const initialFormState = { student_name: '', phone: '', school: '', test_score: '', total_question: '', wrong_questions: '', assignment1: '', assignment2: '', memo: '' };

const ScoreInputPage = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [newRound, setNewRound] = useState({ text: '', date: '' });
    const [scoreList, setScoreList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formState, setFormState] = useState(initialFormState);
    const [searchResults, setSearchResults] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [nameError, setNameError] = useState('');
    const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
    const [lastTotalQuestions, setLastTotalQuestions] = useState('');
    const { showToast } = useToast();
    const { refreshKey } = useDataRefresh();

    const getSuggestedDate = useCallback((className, roundText) => {
        const roundNum = parseInt(roundText, 10);
        // 2회차 이상이고, 이전 회차 정보가 있으면 7일 추가
        if (roundNum > 1) {
            const prevRound = rounds.find(r => r.round === String(roundNum - 1));
            if (prevRound && prevRound.date) {
                const prevDate = new Date(prevRound.date);
                prevDate.setDate(prevDate.getDate() + 7);
                return prevDate.toISOString().split('T')[0];
            }
        }
        // 그 외의 경우 (1회차, 이전 회차 정보 없음 등)
        const dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
        if (!className) return '';
        const targetDayChar = className.charAt(0);
        const targetDay = dayMap[targetDayChar];
        if (targetDay === undefined) return new Date().toISOString().split('T')[0];
        const today = new Date();
        const currentDay = today.getDay();
        let dayDifference = targetDay - currentDay;
        if (dayDifference < 0) dayDifference += 7;
        today.setDate(today.getDate() + dayDifference);
        return today.toISOString().split('T')[0];
    }, [rounds]);

    useEffect(() => {
        axios.get('/api/attendance/classes')
            .then(res => {
                setClasses(res.data);
                if (res.data.length > 0)
                    setSelectedClass(res.data[0]);
            })
            .catch(() => showToast('분반 목록을 불러오는 데 실패했습니다.', 'error'));
    }, [showToast]);

    const fetchRounds = useCallback(() => {
        if (!selectedClass)
            return;

        axios.get(`/api/scores/rounds?className=${selectedClass}`)
            .then(res => {
                setRounds(res.data);
                if (res.data.length > 0) {
                    setSelectedRound(res.data[0].round);
                } else {
                    setSelectedRound('new');
                }
            })
            .catch(() => showToast('회차 목록 로딩 실패', 'error'));
    }, [selectedClass, showToast]);

    useEffect(() => { fetchRounds(); }, [fetchRounds]);

    const fetchList = useCallback(async () => {
        if (!selectedClass) return;
        setIsLoading(true);
        try {
            let response;
            if (selectedRound && selectedRound !== 'new') {
                response = await axios.get(`/api/scores/list?className=${selectedClass}&round=${selectedRound}`);
            } else {
                response = await axios.get(`/api/scores/roster?className=${selectedClass}`);
            }
            setScoreList(response.data);
        } catch (err) {
            showToast('목록을 불러오는 데 실패했습니다.', 'error');
            setScoreList([]);
        } finally { setIsLoading(false); }
    }, [selectedClass, selectedRound, showToast]);

    useEffect(() => { fetchList(); }, [fetchList, refreshKey]);

    useEffect(() => {
        if (selectedRound === 'new' && selectedClass) {
            const suggestedDate = getSuggestedDate(selectedClass, newRound.text);
            setNewRound(prev => ({ ...prev, date: suggestedDate }));
        }
    }, [newRound.text, selectedRound, selectedClass, getSuggestedDate]);

    const handleAddRound = () => {
        const roundToAdd = newRound.text.trim();
        if (roundToAdd && !rounds.some(r => r.round === roundToAdd)) {
            const newRounds = [...rounds, { round: roundToAdd, date: newRound.date }].sort((a, b) => parseInt(a.round, 10) - parseInt(b.round, 10));
            setRounds(newRounds);
            setSelectedRound(roundToAdd);
            setNewRound({ text: '', date: '' });
            showToast(`'${roundToAdd}회차'가 추가되었습니다.`, 'success');
        } else if (rounds.some(r => r.round === roundToAdd)) {
            showToast('이미 존재하는 회차입니다.', 'error');
        } else {
            showToast('회차를 입력해주세요.', 'error');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        if (name === 'student_name') {
            setFormState(prev => ({ ...prev, student_name: value, phone: '', school: '' }));
            setNameError('');
            setHighlightedIndex(-1);

            if (value && selectedClass) {
                axios.get(`/api/scores/search-student?className=${selectedClass}&name=${value}`)
                    .then(res => {
                        setSearchResults(res.data);
                    });
            } else {
                setSearchResults([]);
            }
        } else if (name === 'total_question') {
            setFormState(prev => ({ ...prev, [name]: value }));
            setLastTotalQuestions(value); // 총 문항수 기억
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleKeyDown = (e) => {
        if (searchResults.length === 0)
            return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0)); }
        else if (e.key === 'Enter' && highlightedIndex > -1) { e.preventDefault(); handleSelectStudent(searchResults[highlightedIndex]); }
    };

    const handleSelectStudent = (student) => {
        setFormState(prev => ({
            ...prev,
            student_name: student.student_name,
            phone: student.phone,
            school: student.school,
            total_question: lastTotalQuestions
        }));
        setSearchResults([]);
        setNameError('');
    };

    const handleNameBlur = () => {
        setTimeout(() => {
            const typedName = formState.student_name.trim();
            const exactMatches = searchResults.filter(s => s.student_name === typedName);

            if (!formState.phone) {
                if (exactMatches.length === 1) {
                    handleSelectStudent(exactMatches[0]); // 정확히 1명인 경우 자동 선택
                } else if (exactMatches.length > 1) {
                    setNameError("동명이인이 존재합니다. 목록에서 학생을 선택해주세요.");
                } else if (typedName !== '') {
                    setNameError("해당 분반에 없는 학생입니다. 분반, 학생 이름을 확인해주세요.");
                }
            }

            setSearchResults([]); // 검색 목록은 항상 지움
        }, 150);
    };


    const handleSave = async (e) => {
        e.preventDefault();
        const finalRound = selectedRound === 'new' ? newRound.text.trim() : selectedRound;
        const roundData = rounds.find(r => r.round === finalRound) || newRound;
        const finalDate = roundData.date;

        if (!formState.phone) { showToast('학생 정보가 올바르지 않습니다. 목록에서 학생을 선택해주세요.', 'error'); return; }
        if (!formState.test_score || !formState.total_question || !formState.assignment1 || !formState.assignment2 || !finalRound) {
            showToast('필수 항목(*)을 모두 입력해주세요.', 'error'); return;
        }

        try {
            await axios.post('/api/scores/save', { ...formState, class_name: selectedClass, round: finalRound, date: finalDate });
            showToast('성공적으로 저장되었습니다.', 'success');
            fetchList();
            setFormState(initialFormState);
        } catch (err) { showToast(err.response?.data?.error || '저장에 실패했습니다.', 'error'); }
    };

    const handleClear = () => { setFormState(initialFormState); setNameError(''); };

    const handleSaveWrongQuestions = (value, count) => {
        setFormState(prev => {
            const total = parseInt(prev.total_question, 10);
            if (isNaN(total)) {
                showToast('총 문항수를 먼저 입력해야 점수가 자동 계산됩니다.', 'error');
                return { ...prev, wrong_questions: value };
            }
            const newScore = total - count;
            return { ...prev, wrong_questions: value, test_score: newScore >= 0 ? newScore : 0 };
        });
    };

    const scoreSummary = useMemo(() => {
        const validScores = scoreList.filter(s => s.test_score != null);
        if (validScores.length === 0) {
            return { avg: '-', total: lastTotalQuestions || '-' };
        }
        const sum = validScores.reduce((acc, s) => acc + s.test_score, 0);
        const avg = (sum / validScores.length).toFixed(1);
        const total = scoreList.find(s => s.total_question != null)?.total_question || lastTotalQuestions || '-';
        return { avg, total };
    }, [scoreList, lastTotalQuestions]);

    const currentRoundDate = (rounds.find(r => r.round === selectedRound)?.date || '').split('T')[0];

    return (
        <div className="score-page-container">
            {isOmrModalOpen && <WrongQuestionsModal totalQuestions={parseInt(formState.total_question, 10) || 0} initialValue={formState.wrong_questions} onSave={handleSaveWrongQuestions} onClose={() => setIsOmrModalOpen(false)} />}
            <div className="score-left-panel">
                <div className="score-controls">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)}>
                        <option value="">회차 선택</option>
                        {rounds.map(r => <option key={r.round} value={r.round}>{r.round}회차</option>)}
                        <option value="new">새 회차 추가</option>
                    </select>
                </div>
                {selectedRound === 'new' && (
                    <div className="new-round-container">
                        <input type="text" placeholder="새 회차 (예: 4)" value={newRound.text} onChange={e => setNewRound(p => ({ ...p, text: e.target.value }))} />
                        <input type="date" value={newRound.date} onChange={e => setNewRound(p => ({ ...p, date: e.target.value }))} />
                        <button onClick={handleAddRound}>등록</button>
                    </div>
                )}
                <div className="score-list-wrapper">
                    <div className="list-header">
                        <span>[{selectedClass} / {selectedRound === 'new' ? `${newRound.text || '?'}회차` : `${selectedRound}회차`} {currentRoundDate && `(${currentRoundDate})`}]</span>
                        <button onClick={fetchList} className="refresh-btn" title="새로고침">🔄</button>
                    </div>
                    <div className="list-summary">
                        <span>테스트 평균: {scoreSummary.avg} / {scoreSummary.total}</span>
                    </div>
                    <div className="list-content">
                        <table className="score-table">
                            <thead><tr><th>이름</th><th>전화번호</th><th>학교</th><th>점수</th><th>과제1</th><th>과제2</th></tr></thead>
                            <tbody>
                                {isLoading ? (<tr><td colSpan="6">로딩 중...</td></tr>)
                                    : scoreList.length > 0 ? (scoreList.map((s, i) => (
                                        <tr key={s.phone || i}><td>{s.student_name}</td><td>{s.phone}</td><td>{s.school}</td><td>{s.test_score ?? '-'}</td><td>{s.assignment1 ?? '-'}</td><td>{s.assignment2 ?? '-'}</td></tr>
                                    )))
                                        : (<tr><td colSpan="6">학생 명단이 없거나 성적 데이터가 없습니다.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="score-right-panel">
                <form onSubmit={handleSave}>
                    <h3>성적 입력</h3>
                    <div className="form-group autocomplete">
                        <label>이름*</label>
                        <input type="text" name="student_name" value={formState.student_name} onChange={handleFormChange} onKeyDown={handleKeyDown} onBlur={handleNameBlur} required autoComplete="off" />
                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((s, i) => (
                                    <li key={s.phone} className={i === highlightedIndex ? 'highlighted' : ''} onMouseDown={() => handleSelectStudent(s)}>
                                        {s.student_name} ({s.school}, {s.phone})
                                    </li>
                                ))}
                            </ul>
                        )}
                        {nameError && <p className="error-message">{nameError}</p>}
                    </div>
                    <div className="form-group-row">
                        <div className="form-group"><label>테스트 점수*</label><input type="number" min="0" step="any" name="test_score" value={formState.test_score} onChange={handleFormChange} required /></div>
                        <div className="form-group"><label>총 문항수*</label><input type="number" min="0" step="1" name="total_question" value={formState.total_question} onChange={handleFormChange} required /></div>
                    </div>
                    <div className="form-group">
                        <label>틀린 문항</label>
                        <input
                            type="text"
                            readOnly
                            onClick={() => formState.total_question && setIsOmrModalOpen(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && formState.total_question && !isOmrModalOpen) {
                                    e.preventDefault();
                                    setIsOmrModalOpen(true);
                                }
                            }}
                            value={formState.wrong_questions}
                            placeholder="총 문항 수 입력 후 클릭..."
                            style={{ cursor: formState.total_question ? 'pointer' : 'not-allowed' }}
                            tabIndex={0}
                        />
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>과제 성취도 1*</label>
                            <select name="assignment1" value={formState.assignment1} onChange={handleFormChange} required>
                                <option value="">선택</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="F">F</option><option value="F(미제출)">F(미제출)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>과제 성취도 2*</label>
                            <select name="assignment2" value={formState.assignment2} onChange={handleFormChange} required>
                                <option value="">선택</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="F">F</option><option value="F(미제출)">F(미제출)</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>메모</label>
                        <textarea name="memo" value={formState.memo} onChange={handleFormChange}></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={handleClear} className="clear-btn">초기화</button>
                        <button type="submit" className="save-btn">저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScoreInputPage;
