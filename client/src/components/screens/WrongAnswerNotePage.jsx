import React, { useState, useEffect } from 'react';
import { getIncorrectQuestions } from '../api';
// 다른 API (학생 목록, 자료 목록 조회 등)도 필요에 따라 import
// import { getStudents, getMaterials } from '../api';

function WrongAnswerNotePage() {
    // Dropdown에 채울 데이터 (실제로는 API로 받아와야 함)
    const [students, setStudents] = useState([]); 
    const [materials, setMaterials] = useState([]);
    
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [incorrectQuestions, setIncorrectQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // 페이지 로드 시 학생/자료 목록을 가져오는 로직 (예시)
    useEffect(() => {
        // const fetchInitialData = async () => {
        //     const studentsRes = await getStudents();
        //     const materialsRes = await getMaterials();
        //     setStudents(studentsRes.data);
        //     setMaterials(materialsRes.data);
        // };
        // fetchInitialData();
    }, []);

    const handleGenerate = async () => {
        if (!selectedStudent || !selectedMaterial) {
            return alert('학생과 자료를 모두 선택하세요.');
        }
        setIsLoading(true);
        try {
            const params = { studentPhone: selectedStudent, materialId: selectedMaterial };
            const response = await getIncorrectQuestions(params);
            setIncorrectQuestions(response.data);
        } catch (error) {
            console.error('오답노트 생성 실패:', error);
            alert('오답노트를 가져오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>오답노트 생성기</h1>
            {/* Select dropdowns for student and material */}
            <select onChange={(e) => setSelectedStudent(e.target.value)} value={selectedStudent}>
                <option value="">학생 선택</option>
                {/* students.map(...) */}
            </select>
            <select onChange={(e) => setSelectedMaterial(e.target.value)} value={selectedMaterial}>
                <option value="">강의 자료 선택</option>
                {/* materials.map(...) */}
            </select>
            <button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? '생성 중...' : '오답노트 생성'}
            </button>

            <hr />
            <div id="incorrect-note-view">
                <h2>오답 문항 목록</h2>
                {isLoading && <p>로딩 중...</p>}
                {!isLoading && incorrectQuestions.length > 0 ? (
                    incorrectQuestions.map(q => (
                        <div key={q.id} className="question-item">
                            <p><b>문항 번호: {q.q_number}</b> (정답: {q.answer})</p>
                            <img src={q.q_image_url} alt={`문제 ${q.q_number}`} style={{ width: '100%', border: '1px solid #eee' }}/>
                        </div>
                    ))
                ) : (
                    !isLoading && <p>조회된 오답 문항이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default WrongAnswerNotePage;
