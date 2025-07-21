import axios from 'axios';

// API 요청을 위한 기본 axios 인스턴스 생성
const api = axios.create({
    // .env 파일에 설정된 REACT_APP_API_URL 값을 기본 URL로 사용
    baseURL: process.env.REACT_APP_API_URL,
    // 필요 시 다른 기본 설정 추가 가능 (예: 타임아웃, 기본 헤더 등)
    // timeout: 5000, 
});

export default api;
