import axios from 'axios';

// API 요청을 위한 기본 axios 인스턴스 생성
const api = axios.create({
    // .env 파일에 설정된 REACT_APP_API_URL 값을 기본 URL로 사용
    baseURL: process.env.REACT_APP_API_URL,
    // 필요 시 다른 기본 설정 추가 가능 (예: 타임아웃, 기본 헤더 등)
    // timeout: 5000, 
});

// --- [신규 추가] 강의 자료 관련 API ---

// 1. PDF 파일과 메타데이터 업로드
export const uploadMaterial = (formData) => {
    return apiClient.post('/api/materials/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// 2. 문항 정보(좌표, 정답 등) 저장
export const saveQuestions = (data) => {
    // data = { materialId: 1, questions: [...] }
    return apiClient.post('/api/materials/questions', data);
};

// --- [신규 추가] 오답노트 관련 API ---

// 3. 학생의 오답 문항 목록 조회
export const getIncorrectQuestions = (params) => {
    // params = { studentPhone: '010-1234-5678', materialId: 1 }
    return apiClient.get('/api/notes/incorrect', { params });
};

export default api;
