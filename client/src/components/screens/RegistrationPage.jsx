import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import './RegistrationPage.css';
import api from '../../api';

const RegistrationPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const { showToast } = useToast();
    const { triggerRefresh } = useDataRefresh();

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setUploadResult(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showToast('업로드할 엑셀 파일을 선택해주세요.', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('rosterFile', selectedFile);
        setIsUploading(true);
        setUploadResult(null);

        try {
            const res = await api.post('/api/registration/upload-roster', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult(res.data);
            showToast('업로드가 완료되었습니다.', 'success');
            triggerRefresh();
        } catch (err) {
            const errorMessage = err.response?.data?.error || '업로드에 실패했습니다. 파일 형식이나 내용을 확인해주세요.';
            showToast(errorMessage, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await api.get(`/api/export/download-all-students`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const filename = "전체_학생_종합리포트.xlsx";
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const errorMessage = '다운로드에 실패했습니다. DB에 등록된 분반이 있는지 확인해주세요.';
            showToast(errorMessage, 'error');
        }
    };

    return (
        <div className="registration-page-container">
            <h2>신규 학생 일괄 등록 및 관리</h2>

            <div className="upload-section">
                <h3>분반별 학생 명단 등록 (엑셀)</h3>
                <p className="description">
                    엑셀 파일의 각 시트(Sheet) 이름을 등록할 분반 이름과 동일하게 설정해주세요.<br />
                    시스템이 시트 이름을 인식하여 해당하는 분반에 학생들을 자동으로 등록합니다.
                </p>

                <div className="upload-step">
                    <h4>1. 템플릿 다운로드 및 데이터 관리</h4>
                    <div>
                        <a href="/template_roster.xlsx" download className="template-btn">
                            업로드 템플릿 다운로드
                        </a>
                        <button onClick={handleDownload} className="excel-download-btn">
                            전체 학생 정보 다운로드
                        </button>
                    </div>
                    <p>템플릿의 Sheet 이름을 실제 분반 이름으로 변경하고, 학생 정보를 입력하여 업로드할 수 있습니다.<br />
                        다운로드 버튼으로 현재 DB에 저장된 모든 학생의 출결/성적 데이터를 백업할 수 있습니다.
                    </p>
                </div>

                <div className="upload-step">
                    <h4>2. 파일 업로드</h4>
                    <div className="upload-controls">
                        <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} />
                        <label htmlFor="file-upload" className="file-upload-label">
                            {selectedFile ? selectedFile.name : '파일 선택'}
                        </label>
                    </div>
                </div>

                <button onClick={handleUpload} disabled={isUploading || !selectedFile} className="upload-btn">
                    {isUploading ? '업로드 중...' : '업로드 및 등록'}
                </button>

                {uploadResult && (
                    <div className="upload-result">
                        <h4>업로드 결과: {uploadResult.message}</h4>
                        <ul>
                            <li>총 처리 학생: <span className="info-text">{uploadResult.totalCount}</span> 명</li>
                            <li>신규 등록 성공: <span className="success-text">{uploadResult.addedCount}</span> 명</li>
                            <li>중복으로 제외: <span className="skipped-text">{uploadResult.skippedCount}</span> 명</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationPage;
