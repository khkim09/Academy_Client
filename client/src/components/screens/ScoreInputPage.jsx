import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import WrongQuestionsModal from '../common/WrongQuestionsModal';
import './ScoreInputPage.css';

const initialFormState = { student_name: '', phone: '', school: '', test_score: '', total_question: '', wrong_questions: '', assignment1: '', assignment2: '', memo: '' };

const ScoreInputPage = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState(''); // 이제 round의 ID를 저장합니다.
    const [newRoundNumber, setNewRoundNumber] = useState('');
    const [newRoundName, setNewRoundName] = useState('');
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

    const fetchClasses = useCallback(() => {
        api.get('/api/attendance/classes')
            .then(res => setClasses(res.data))
            .catch(() => showToast('분반 목록을 불러오는 데 실패했습니다.', 'error'));
    }, [showToast]);

    const fetchRounds = useCallback(() => {
        if (!selectedClass) {
            setRounds([]);
            setSelectedRound('');
            return;
        }
        api.get(`/api/rounds/list?className=${selectedClass}`)
            .then(res => setRounds(res.data))
            .catch(() => showToast('회차 목록 로딩 실패', 'error'));
    }, [selectedClass, showToast]);

    const fetchList = useCallback(async () => {
        if (!selectedClass || !selectedRound) {
            setScoreList([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.get('/api/scores/list', { params: { className: selectedClass, roundId: selectedRound } });
            setScoreList(res.data);
            if (res.data.length > 0) {
                const recentScore = res.data.find(s => s.total_question);
                if (recentScore) setLastTotalQuestions(recentScore.total_question);
            }
        } catch (err) {
            showToast('성적 목록을 불러오는 데 실패했습니다.', 'error');
            setScoreList([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedClass, selectedRound, showToast]);

    useEffect(fetchClasses, [refreshKey]);
    useEffect(fetchRounds, [selectedClass, refreshKey]);
    useEffect(fetchList, [selectedRound, refreshKey]);

    const handleCreateRound = async () => {
        if (!newRoundNumber) { showToast('새 회차 번호를 입력하세요.', 'error'); return; }
        try {
            const res = await api.post('/api/rounds/create', { className: selectedClass, roundNumber: newRoundNumber, roundName: newRoundName });
            showToast(`${newRoundNumber}회차가 생성되었습니다.`, 'success');
            setRounds(prev => [...prev, res.data].sort((a, b) => a.round_number - b.round_number));
            setSelectedRound(res.data.id);
            setNewRoundNumber('');
            setNewRoundName('');
        } catch (err) {
            showToast(err.response?.data?.error || '회차 생성에 실패했습니다.', 'error');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (name === 'student_name') {
            if (value) {
                api.get(`/api/scores/search-student?className=${selectedClass}&name=${value}`)
                    .then(res => setSearchResults(res.data));
            } else { setSearchResults([]); }
        }
    };

    const handleSelectStudent = (student) => {
        setFormState(prev => ({ ...prev, student_name: student.student_name, phone: student.phone, school: student.school, total_question: lastTotalQuestions }));
        setSearchResults([]);
        setNameError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formState.phone) { showToast('학생 정보가 올바르지 않습니다. 목록에서 학생을 선택해주세요.', 'error'); return; }
        if (!formState.test_score || !formState.total_question) {
            showToast('필수 항목(*)을 모두 입력해주세요.', 'error'); return;
        }
        const testScore = Number(formState.test_score);
        const totalQuestion = Number(formState.total_question);
        if (testScore < totalQuestion && !formState.wrong_questions) {
            showToast('만점이 아닌 경우, 틀린 문항 입력은 필수입니다.', 'error'); return;
        }

        try {
            await api.post('/api/scores/save', { ...formState, round_id: selectedRound });
            showToast('성공적으로 저장되었습니다.', 'success');
            fetchList();
            setFormState(initialFormState);
        } catch (err) {
            showToast(err.response?.data?.error || '저장에 실패했습니다.', 'error');
        }
    };

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

    // ... (KeyDown, NameBlur, Clear 등 나머지 핸들러는 이전과 동일)

    const scoreSummary = useMemo(() => {
        const validScores = scoreList.filter(s => s.test_score != null);
        if (validScores.length === 0) return { avg: '-', total: lastTotalQuestions || '-' };
        const sum = validScores.reduce((acc, s) => acc + Number(s.test_score), 0);
        const avg = (sum / validScores.length).toFixed(1);
        const totalInList = scoreList.find(s => s.total_question != null)?.total_question;
        return { avg, total: totalInList || lastTotalQuestions || '-' };
    }, [scoreList, lastTotalQuestions]);

    return (
        <div className="score-page-container">
            {isOmrModalOpen && <WrongQuestionsModal totalQuestions={parseInt(formState.total_question, 10) || 0} initialValue={formState.wrong_questions} onSave={handleSaveWrongQuestions} onClose={() => setIsOmrModalOpen(false)} />}
            <div className="score-left-panel">
                <div className="score-controls">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}><option value="">분반 선택</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} disabled={!selectedClass}><option value="">회차 선택</option>{rounds.map(r => <option key={r.id} value={r.id}>{r.round_number}회차 ({r.round_name})</option>)}</select>
                </div>
                <div className="new-round-container">
                    <input type="number" placeholder="새 회차 번호" value={newRoundNumber} onChange={e => setNewRoundNumber(e.target.value)} disabled={!selectedClass} />
                    <input type="text" placeholder="회차 이름 (선택)" value={newRoundName} onChange={e => setNewRoundName(e.target.value)} disabled={!selectedClass} />
                    <button onClick={handleCreateRound} disabled={!selectedClass || !newRoundNumber}>새 회차 생성</button>
                </div>
                <div className="score-list-wrapper">
                    <div className="list-header"><span>학생 목록</span> <button onClick={fetchList} className="refresh-btn">🔄</button></div>
                    <div className="list-summary"><span>테스트 평균: {scoreSummary.avg} / {scoreSummary.total}</span></div>
                    <div className="list-content">
                        <table className="score-table">
                            <thead><tr><th>이름</th><th>전화번호</th><th>학교</th><th>점수</th><th>총점</th><th>과제1</th><th>과제2</th></tr></thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="7">로딩 중...</td></tr>
                                    : scoreList.length > 0 ? scoreList.map(s => (
                                        <tr key={s.phone}><td>{s.student_name}</td><td>{s.phone}</td><td>{s.school}</td><td>{s.test_score ?? '-'}</td><td>{s.total_question ?? '-'}</td><td>{s.assignment1 ?? '-'}</td><td>{s.assignment2 ?? '-'}</td></tr>
                                    )) : <tr><td colSpan="7">학생 명단이 없거나 회차를 선택해주세요.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="score-right-panel">
                <form onSubmit={handleSave}>
                    <h3>성적 입력</h3>
                    <div className="form-group autocomplete">
                        <label>학생 이름 (*)</label>
                        <input type="text" name="student_name" value={formState.student_name} onChange={handleFormChange} placeholder="이름을 입력하여 검색" autoComplete="off" />
                        {searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((s, i) => <li key={s.phone} onMouseDown={() => handleSelectStudent(s)}>{s.student_name} ({s.school})</li>)}
                            </ul>
                        )}
                        {nameError && <p className="error-message">{nameError}</p>}
                    </div>
                    <div className="form-group-row">
                        <div className="form-group"><label>총 문항수 (*)</label><input type="number" name="total_question" value={formState.total_question} onChange={handleFormChange} /></div>
                        <div className="form-group"><label>점수 (*)</label><input type="number" name="test_score" value={formState.test_score} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-group">
                        <label>틀린 문항</label>
                        <input type="text" name="wrong_questions" value={formState.wrong_questions} onFocus={() => setIsOmrModalOpen(true)} readOnly placeholder="클릭하여 OMR 입력" />
                    </div>
                    <div className="form-group-row">
                        <div className="form-group"><label>과제1</label><input type="text" name="assignment1" value={formState.assignment1} onChange={handleFormChange} /></div>
                        <div className="form-group"><label>과제2</label><input type="text" name="assignment2" value={formState.assignment2} onChange={handleFormChange} /></div>
                    </div>
                    <div className="form-group"><label>메모</label><textarea name="memo" value={formState.memo} onChange={handleFormChange} /></div>
                    <div className="form-actions"><button type="button" className="clear-btn" onClick={() => setFormState(initialFormState)}>초기화</button><button type="submit" className="save-btn">저장</button></div>
                </form>
            </div>
        </div>
    );
};
export default ScoreInputPage;
