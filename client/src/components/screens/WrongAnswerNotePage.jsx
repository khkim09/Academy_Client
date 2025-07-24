import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import './WrongAnswerNotePage.css';

function WrongAnswerNotePage() {
    // 페이지 상태 관리
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [rounds, setRounds] = useState([]);

    // 필터링을 위한 상태
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(''); // 학생의 phone 번호를 저장
    const [selectedRound, setSelectedRound] = useState('');   // 회차의 ID를 저장

    // 결과 상태
    const [incorrectQuestions, setIncorrectQuestions] = useState([]); // 서버에서 받은 오답 이미지 데이터 목록
    const [isLoading, setIsLoading] = useState(false);               // 로딩 상태
    const { showToast } = useToast();

    // 분반 목록 로딩 (최초 1회)
    useEffect(() => {
        api.get('/api/attendance/classes').then(res => setClasses(res.data));
    }, []);

    // 분반 선택 시, 해당 분반의 학생 목록과 회차 목록을 새로 불러옴
    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setRounds([]);
            return;
        }
        api.get(`/api/scores/roster?className=${selectedClass}`).then(res => setStudents(res.data));
        api.get(`/api/rounds/list?className=${selectedClass}`).then(res => setRounds(res.data));
    }, [selectedClass]);

    // '오답노트 생성' 버튼 클릭 시 실행되는 함수
    const handleGenerate = async () => {
        if (!selectedStudent || !selectedClass || !selectedRound) {
            showToast('분반, 학생, 회차를 모두 선택하세요.', 'error');
            return;
        }
        setIsLoading(true);
        setIncorrectQuestions([]);
        try {
            const params = { studentPhone: selectedStudent, roundId: selectedRound };
            // 서버에 오답노트 이미지 생성 요청
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
            {/* 상단 컨트롤 영역 */}
            <div className="note-controls">
                <h3>오답노트 생성</h3>
                <div className="control-group">
                    {/* 분반 선택 드롭다운 */}
                    <select onChange={e => setSelectedClass(e.target.value)} value={selectedClass}>
                        <option value="">분반 선택</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {/* 학생 선택 드롭다운 (분반 선택 시 활성화) */}
                    <select onChange={e => setSelectedStudent(e.target.value)} value={selectedStudent} disabled={!selectedClass}>
                        <option value="">학생 선택</option>
                        {students.map(s => <option key={s.phone} value={s.phone}>{s.student_name}</option>)}
                    </select>
                    {/* 회차 선택 드롭다운 (분반 선택 시 활성화) */}
                    <select onChange={e => setSelectedRound(e.target.value)} value={selectedRound} disabled={!selectedClass}>
                        <option value="">회차 선택</option>
                        {rounds.map(r => <option key={r.id} value={r.id}>{r.round_number}회차 ({r.round_name})</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? '생성 중...' : '오답노트 생성'}
                </button>
            </div>
            {/* 하단 결과 표시 영역 */}
            <div className="note-results">
                {isLoading ? <p className="loading-text">오답노트를 생성하고 있습니다...</p> :
                    incorrectQuestions.length > 0 ? (
                        // 서버에서 받은 오답 이미지들을 순서대로 화면에 그림
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
