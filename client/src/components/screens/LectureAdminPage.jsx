import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import './LectureAdminPage.css';

// PDF.js 워커 설정: PDF 렌더링에 필요
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function LectureAdminPage() {
    // React Router의 페이지 이동 기능을 사용하기 위한 훅
    const navigate = useNavigate();

    // 페이지에서 사용하는 상태(State) 변수들
    const [classes, setClasses] = useState([]);         // 전체 분반 목록
    const [rounds, setRounds] = useState([]);           // 선택된 분반의 회차 목록
    const [materials, setMaterials] = useState([]);     // 등록된 전체 강의 자료 목록
    const [selectedClass, setSelectedClass] = useState('');   // 선택된 분반
    const [selectedRound, setSelectedRound] = useState('');   // 선택된 회차 ID
    const [materialName, setMaterialName] = useState('');   // 업로드할 자료의 이름
    const [selectedFile, setSelectedFile] = useState(null); // 사용자가 선택한 PDF 파일
    const [isUploading, setIsUploading] = useState(false);  // 업로드 진행 상태
    const { showToast } = useToast();                   // 사용자에게 알림 메시지를 보여주는 훅

    // 컴포넌트가 처음 렌더링될 때 분반 목록을 가져오는 함수
    useEffect(() => {
        api.get('/api/attendance/classes')
            .then(res => setClasses(res.data))
            .catch(() => showToast('분반 목록 로딩 실패', 'error'));
    }, [showToast]);

    // 등록된 전체 강의 자료 목록을 가져오는 함수
    const fetchMaterials = useCallback(() => {
        api.get('/api/materials/list')
            .then(res => setMaterials(res.data))
            .catch(() => showToast('자료 목록 로딩 실패', 'error'));
    }, [showToast]);

    useEffect(fetchMaterials, [fetchMaterials]);

    // 분반을 선택했을 때 해당하는 회차 목록을 가져오는 함수
    useEffect(() => {
        if (selectedClass) {
            api.get(`/api/rounds/list?className=${selectedClass}`)
                .then(res => setRounds(res.data))
                .catch(() => showToast('회차 목록 로딩 실패', 'error'));
        } else {
            setRounds([]); // 분반 선택이 해제되면 회차 목록도 초기화
        }
    }, [selectedClass, showToast]);

    // 파일 선택 input의 변경을 감지하는 핸들러
    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    // '업로드' 버튼 클릭 시 실행되는 함수
    const handleUpload = async (e) => {
        e.preventDefault(); // 폼의 기본 제출 동작 방지
        if (!selectedClass || !selectedRound || !materialName || !selectedFile) {
            showToast('모든 필드를 입력해야 합니다.', 'error');
            return;
        }

        // 서버로 보낼 데이터를 FormData 객체에 담음 (파일 전송에 필수)
        const formData = new FormData();
        formData.append('materialFile', selectedFile);
        formData.append('roundId', selectedRound);
        formData.append('materialName', materialName);

        try {
            setIsUploading(true);
            // PDF 파일의 전체 페이지 수를 알아내어 함께 전송
            const pdfDoc = await pdfjs.getDocument(URL.createObjectURL(selectedFile)).promise;
            formData.append('totalPages', pdfDoc.numPages);

            // 서버의 업로드 API 호출
            const response = await api.post('/api/materials/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('파일이 성공적으로 업로드되었습니다.', 'success');
            fetchMaterials(); // 자료 목록 새로고침

            // 업로드 성공 시, 바로 해당 자료의 문제 영역 편집 페이지로 이동
            navigate(`/editor/${response.data.materialId}`);
        } catch (err) {
            showToast(err.response?.data?.error || '업로드 중 오류 발생', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="material-page-container">
            {/* 좌측 패널: 등록된 자료 목록 */}
            <div className="material-left-panel">
                <h3>등록된 강의 자료</h3>
                <div className="file-list-wrapper">
                    <table className="file-list-table">
                        <thead><tr><th>자료명</th><th>분반</th><th>회차</th><th>업로드 날짜</th><th>액션</th></tr></thead>
                        <tbody>
                            {materials.length > 0 ? (
                                materials.map(m => (
                                    <tr key={m.id}>
                                        <td>{m.material_name}</td>
                                        <td>{m.class_name}</td>
                                        <td>{m.round_number}회차</td>
                                        <td>{new Date(m.uploaded_at).toLocaleString()}</td>
                                        <td><button onClick={() => navigate(`/editor/${m.id}`)}>문제 영역 설정</button></td>
                                    </tr>
                                ))
                            ) : (<tr><td colSpan="5">등록된 자료가 없습니다.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 우측 패널: 새 자료 업로드 폼 */}
            <div className="material-right-panel">
                <h3>새 자료 업로드</h3>
                <form className="upload-form" onSubmit={handleUpload}>
                    <div className="form-group"><label>분반</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required><option value="">선택</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>회차</label><select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} required disabled={!selectedClass}><option value="">선택</option>{rounds.map(r => <option key={r.id} value={r.id}>{r.round_number}회차 ({r.round_name})</option>)}</select></div>
                    <div className="form-group"><label>자료명</label><input type="text" placeholder="예: 9월 모의고사" value={materialName} onChange={e => setMaterialName(e.target.value)} required /></div>
                    <div className="form-group"><label>PDF 파일</label><input type="file" onChange={handleFileChange} accept=".pdf" required /></div>
                    <button type="submit" className="upload-btn" disabled={isUploading}>{isUploading ? '업로드 중...' : '업로드 및 문제 설정'}</button>
                </form>
            </div>
        </div>
    );
}

export default LectureAdminPage;
