import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import './LectureAdminPage.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function LectureAdminPage() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedRound, setSelectedRound] = useState('');
    const [materialName, setMaterialName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        api.get('/api/attendance/classes')
            .then(res => setClasses(res.data))
            .catch(() => showToast('분반 목록 로딩 실패', 'error'));
    }, [showToast]);

    const fetchMaterials = useCallback(() => {
        api.get('/api/materials/list')
            .then(res => setMaterials(res.data))
            .catch(() => showToast('자료 목록 로딩 실패', 'error'));
    }, [showToast]);

    useEffect(fetchMaterials, [fetchMaterials]);

    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedClass || !selectedRound || !materialName || !selectedFile) {
            showToast('모든 필드를 입력해야 합니다.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('materialFile', selectedFile);
        formData.append('className', selectedClass);
        formData.append('round', selectedRound);
        formData.append('materialName', materialName);

        try {
            setIsUploading(true);
            const pdfDoc = await pdfjs.getDocument(URL.createObjectURL(selectedFile)).promise;
            formData.append('totalPages', pdfDoc.numPages);

            const response = await api.post('/api/materials/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast('파일이 성공적으로 업로드되었습니다.', 'success');
            fetchMaterials();
            navigate(`/editor/${response.data.materialId}`); // 편집 페이지로 바로 이동
        } catch (err) {
            showToast(err.response?.data?.error || '업로드 중 오류 발생', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="material-page-container">
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
                                        <td>{m.round}회차</td>
                                        <td>{new Date(m.uploaded_at).toLocaleString()}</td>
                                        <td><button onClick={() => navigate(`/editor/${m.id}`)}>문제 영역 설정</button></td>
                                    </tr>
                                ))
                            ) : (<tr><td colSpan="5">등록된 자료가 없습니다.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="material-right-panel">
                <h3>새 자료 업로드</h3>
                <form className="upload-form" onSubmit={handleUpload}>
                    <div className="form-group"><label>분반</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required><option value="">선택</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>회차</label><input type="number" placeholder="회차 번호" value={selectedRound} onChange={e => setSelectedRound(e.target.value)} required /></div>
                    <div className="form-group"><label>자료명</label><input type="text" placeholder="예: 9월 모의고사" value={materialName} onChange={e => setMaterialName(e.target.value)} required /></div>
                    <div className="form-group"><label>PDF 파일</label><input type="file" onChange={handleFileChange} accept=".pdf" required /></div>
                    <button type="submit" className="upload-btn" disabled={isUploading}>{isUploading ? '업로드 중...' : '업로드 및 문제 설정'}</button>
                </form>
            </div>
        </div>
    );
}

export default LectureAdminPage;
