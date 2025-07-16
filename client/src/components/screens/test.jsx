import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
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
    const [lastTotalQuestions, setLastTotalQuestions] = useState(''); // 총 문항수 기억
    const { showToast } = useToast();

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
            .then(res => { setClasses(res.data); if (res.data.length > 0) setSelectedClass(res.data[0]); })
            .catch(() => showToast('분반 목록 로딩 실패', 'error'));
    }, [showToast]);

    const fetchRounds = useCallback(() => {
        if (!selectedClass) return;
        setLastTotalQuestions(''); // 분반 바뀌면 총 문항수 초기화
        axios.get(`/api/scores/rounds?className=${selectedClass}`)
            .then(res => {
                setRounds(res.data);
                if (res.data.length > 0) setSelectedRound(res.data[0].round);
                else setSelectedRound('new');
            })
            .catch(() => showToast('회차 목록 로딩 실패', 'error'));
    }, [selectedClass, showToast]);

    useEffect(fetchRounds, [fetchRounds]);

    const fetchList = useCallback(async () => { /* 이전과 동일 */ }, [selectedClass, selectedRound, showToast]);
    useEffect(fetchList, [fetchList]);

    // [수정] 새 회차 텍스트 입력 시 날짜 자동 추천
    useEffect(() => {
        if (selectedRound === 'new' && selectedClass) {
            const suggestedDate = getSuggestedDate(selectedClass, newRound.text);
            setNewRound(prev => ({ ...prev, date: suggestedDate }));
        }
    }, [newRound.text, selectedRound, selectedClass, getSuggestedDate]);

    const handleAddRound = () => { /* 이전과 동일 */ };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'student_name') {
            setFormState(prev => ({ ...prev, student_name: value, phone: '', school: '' }));
            setNameError('');
            setHighlightedIndex(-1);
            if (value && selectedClass) {
                axios.get(`/api/scores/search-student?className=${selectedClass}&name=${value}`)
                    .then(res => setSearchResults(res.data));
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

    const handleKeyDown = (e) => { /* 이전과 동일 */ };

    const handleSelectStudent = (student) => {
        setFormState(prev => ({ ...prev, student_name: student.student_name, phone: student.phone, school: student.school, total_question: lastTotalQuestions }));
        setSearchResults([]);
        setNameError('');
    };

    const handleNameBlur = () => { /* 이전과 동일 */ };
    const handleSave = async (e) => { /* 이전과 동일 */ };
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

    // [신설] 평균 점수 계산 로직
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
            {isOmrModalOpen && <WrongQuestionsModal /* 이전과 동일 */ />}
            <div className="score-left-panel">
                <div className="score-controls">{/* ... */}</div>
                {selectedRound === 'new' && (<div className="new-round-container">{/* ... */}</div>)}
                <div className="score-list-wrapper">
                    <div className="list-header">{/* ... */}</div>
                    {/* [신설] 평균 점수 헤더 */}
                    <div className="list-summary">
                        <span>테스트 평균: {scoreSummary.avg} / {scoreSummary.total}</span>
                    </div>
                    <div className="list-content">{/* ... */}</div>
                </div>
            </div>
            <div className="score-right-panel">
                <form onSubmit={handleSave}>
                    <h3>성적 입력</h3>
                    <div className="form-group autocomplete">
                        <label>이름*</label>
                        <input type="text" name="student_name" value={formState.student_name} onChange={handleFormChange} onKeyDown={handleKeyDown} onBlur={handleNameBlur} required autoComplete="off" />
                        {searchResults.length > 0 && (<ul className="search-results">{/* ... */}</ul>)}
                        {nameError && <p className="error-message">{nameError}</p>}
                    </div>
                    <div className="form-group-row">
                        <div className="form-group"><label>테스트 점수*</label><input type="number" min="0" step="any" name="test_score" value={formState.test_score} onChange={handleFormChange} required /></div>
                        <div className="form-group"><label>총 문항수*</label><input type="number" min="0" step="1" name="total_question" value={formState.total_question} onChange={handleFormChange} required /></div>
                    </div>
                    {/* ... 나머지 폼 ... */}
                </form>
            </div>
        </div>
    );
};

export default ScoreInputPage;
