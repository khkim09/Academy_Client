import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import './LectureAdminPage.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function LectureAdminPage() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [rounds, setRounds] = useState([]);
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

    useEffect(() => {
        if (selectedClass) {
            api.get(`/api/rounds/list?className=${selectedClass}`)
                .then(res => setRounds(res.data))
                .catch(() => showToast('회차 목록 로딩 실패', 'error'));
        } else {
            setRounds([]);
        }
    }, [selectedClass, showToast]);

    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!selectedClass || !selectedRound || !materialName || !selectedFile) {
            showToast('모든 필드를 입력해야 합니다.', 'error');
            return;
        }

        const formData = new FormData();
        // [수정] 백엔드의 upload.single('materialFile')과 키를 일치시킴
        formData.append('materialFile', selectedFile);
        formData.append('roundId', selectedRound);
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
            navigate(`/editor/${response.data.materialId}`);
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
            <div className="material-right-panel">
                <h3>새 자료 업로드</h3>
                <div className="upload-section-inner">
                    <div className="form-group"><label>분반</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required><option value="">선택</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>회차</label><select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} required disabled={!selectedClass}><option value="">선택</option>{rounds.map(r => <option key={r.id} value={r.id}>{r.round_number}회차 ({r.round_name})</option>)}</select></div>
                    <div className="form-group"><label>자료명</label><input type="text" placeholder="예: 9월 모의고사" value={materialName} onChange={e => setMaterialName(e.target.value)} required /></div>

                    {/* [수정] 파일 업로드 UI를 RegistrationPage와 동일하게 변경 */}
                    <div className="form-group">
                        <label>PDF 파일</label>
                        <div className="upload-controls">
                            <label htmlFor="pdf-upload" className="file-upload-label">
                                {selectedFile ? selectedFile.name : 'PDF 파일 선택'}
                            </label>
                            <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} />
                        </div>
                    </div>
                    <button onClick={handleUpload} disabled={isUploading || !selectedFile} className="upload-btn">
                        {isUploading ? '업로드 중...' : '업로드 및 문제 설정'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LectureAdminPage;
