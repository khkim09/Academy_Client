import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import './WrongAnswerNotePage.css';

function WrongAnswerNotePage() {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [rounds, setRounds] = useState([]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedRound, setSelectedRound] = useState('');

    const [incorrectQuestions, setIncorrectQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        api.get('/api/attendance/classes').then(res => setClasses(res.data));
    }, []);

    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setRounds([]);
            return;
        }
        api.get(`/api/scores/roster?className=${selectedClass}`).then(res => setStudents(res.data));
        api.get(`/api/scores/rounds?className=${selectedClass}`).then(res => setRounds(res.data));
    }, [selectedClass]);

    const handleGenerate = async () => {
        if (!selectedStudent || !selectedClass || !selectedRound) {
            showToast('분반, 학생, 회차를 모두 선택하세요.', 'error');
            return;
        }
        setIsLoading(true);
        setIncorrectQuestions([]);
        try {
            const params = { studentPhone: selectedStudent, className: selectedClass, round: selectedRound };
            const response = await api.get('/api/materials/generate-note-images', { params });
            setIncorrectQuestions(response.data);
            if (response.data.length === 0) {
                showToast('해당 학생은 틀린 문항이 없거나, 오답노트 생성을 위한 자료가 준비되지 않았습니다.', 'info');
            }
        } catch (error) {
            showToast('오답노트를 가져오는 데 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="note-page-container">
            <div className="note-controls">
                <h3>오답노트 생성</h3>
                <div className="control-group">
                    <select onChange={e => setSelectedClass(e.target.value)} value={selectedClass}><option value="">분반 선택</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select onChange={e => setSelectedStudent(e.target.value)} value={selectedStudent} disabled={!selectedClass}><option value="">학생 선택</option>{students.map(s => <option key={s.phone} value={s.phone}>{s.student_name}</option>)}</select>
                    <select onChange={e => setSelectedRound(e.target.value)} value={selectedRound} disabled={!selectedClass}><option value="">회차 선택</option>{rounds.map(r => <option key={r.round} value={r.round}>{r.round}회차</option>)}</select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading}>{isLoading ? '생성 중...' : '오답노트 생성'}</button>
            </div>
            <div className="note-results">
                {isLoading ? <p className="loading-text">오답노트를 생성하고 있습니다...</p> :
                    incorrectQuestions.length > 0 ? (
                        incorrectQuestions.map(q => (
                            <div key={q.question_number} className="question-item">
                                <h4>문항 번호: {q.question_number}</h4>
                                <img src={q.imageData} alt={`${q.question_number}번 문항 이미지`} />
                            </div>
                        ))
                    ) : <p className="placeholder-text">오답노트를 생성할 학생과 회차를 선택하고 '생성' 버튼을 눌러주세요.</p>
                }
            </div>
        </div>
    );
}

export default WrongAnswerNotePage;
