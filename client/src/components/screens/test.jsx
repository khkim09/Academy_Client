import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import WrongQuestionsModal from '../common/WrongQuestionsModal';
import './ScoreInputPage.css';

const initialFormState = { student_name: '', phone: '', school: '', test_score: '', total_question: '', wrong_questions: '', assignment1: '', assignment2: '', memo: '' };

const getSuggestedDate = (className) => {
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
};


const ScoreInputPage = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [newRound, setNewRound] = useState({ text: '', date: '' });
    const [scoreList, setScoreList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formState, setFormState] = useState(initialFormState);
    const [searchResults, setSearchResults] = useState([]); // 학생 검색 결과 목록
    const [highlightedIndex, setHighlightedIndex] = useState(-1); // 키보드 선택 인덱스
    const [nameError, setNameError] = useState('');
    const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
    const { showToast } = useToast();

    // 분반, 회차, 목록 로딩 로직은 이전과 동일
    useEffect(() => {
        axios.get('/api/attendance/classes')
            .then(res => {
                setClasses(res.data);
                if (res.data.length > 0) setSelectedClass(res.data[0]);
            })
            .catch(() => showToast('분반 목록을 불러오는 데 실패했습니다.', 'error'));
    }, [showToast]);

    const fetchRounds = useCallback(() => {
        if (!selectedClass) return;
        axios.get(`/api/scores/rounds?className=${selectedClass}`)
            .then(res => {
                setRounds(res.data);
                if (res.data.length > 0) {
                    setSelectedRound(res.data[0].round);
                } else {
                    setSelectedRound('new');
                }
            })
            .catch(() => showToast('회차 목록을 불러오는 데 실패했습니다.', 'error'));
    }, [selectedClass, showToast]);

    useEffect(() => { fetchRounds(); }, [selectedClass, fetchRounds]);

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
        } finally {
            setIsLoading(false);
        }
    }, [selectedClass, selectedRound, showToast]);

    useEffect(() => { fetchList(); }, [selectedClass, selectedRound, fetchList]);

    useEffect(() => {
        if (selectedRound === 'new' && selectedClass) {
            setNewRound({ text: '', date: getSuggestedDate(selectedClass) });
        }
    }, [selectedRound, selectedClass]);

    const handleAddRound = () => { /* ... */ };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        // 이름 입력 시, phone과 school은 초기화하여 반드시 재선택하도록 강제
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
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleKeyDown = (e) => { /* 이전과 동일 */ };

    const handleSelectStudent = (student) => {
        setFormState(prev => ({ ...prev, student_name: student.student_name, phone: student.phone, school: student.school }));
        setSearchResults([]);
        setNameError('');
    };

    const handleNameBlur = () => {
        // 잠시 후 실행하여 클릭 이벤트가 먼저 처리되도록 함
        setTimeout(() => {
            if (searchResults.length > 0) {
                if (!formState.phone) setNameError("학생을 목록에서 선택해주세요.");
            }
            setSearchResults([]);
        }, 150);
    };

    const handleSave = async (e) => { /* 이전과 동일 */ };
    const handleClear = () => { setFormState(initialFormState); setNameError(''); };

    // [수정] 점수 자동 계산 로직
    const handleSaveWrongQuestions = (value, count) => {
        setFormState(prev => {
            const total = parseInt(prev.total_question, 10);
            if (isNaN(total)) {
                showToast('총 문항수를 먼저 입력해야 점수가 자동 계산됩니다.', 'error');
                return { ...prev, wrong_questions: value };
            }
            const newScore = total - count;
            return { ...prev, wrong_questions: value, test_score: newScore };
        });
    };

    const currentRoundDate = (rounds.find(r => r.round === selectedRound)?.date || '').split('T')[0];

    return (
        <div className="score-page-container">
            {isOmrModalOpen && <WrongQuestionsModal totalQuestions={parseInt(formState.total_question, 10) || 0} initialValue={formState.wrong_questions} onSave={handleSaveWrongQuestions} onClose={() => setIsOmrModalOpen(false)} />}
            <div className="score-left-panel">{/* ... 이전과 동일 ... */}</div>
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
                    {/* 나머지 폼 요소들은 이전과 동일 */}
                </form>
            </div>
        </div>
    );
};

export default ScoreInputPage;
