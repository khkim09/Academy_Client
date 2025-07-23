// 이전 답변에서 제공한 LectureUploadForm.js 코드를 여기에 붙여넣습니다.
// (분반, 회차, 파일 입력 폼과 API 호출 로직 포함)
import React, { useState } from 'react';
import { uploadMaterial } from '../../api'; // api.js에서 가져옴

function LectureUploadForm({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [className, setClassName] = useState('');
    const [round, setRound] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !className || !round) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        setIsUploading(true);
        const formData = new FormData();
        formData.append('materialFile', file);
        formData.append('className', className);
        formData.append('round', round);

        try {
            const response = await uploadMaterial(formData);
            alert('✅ 업로드 성공! 이제 문항을 등록해주세요.');
            onUploadSuccess(response.data);
        } catch (error) {
            console.error('업로드 실패:', error);
            alert('업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ... JSX 폼 구조 ... */}
            <h2>강의 자료 업로드</h2>
            <input type="text" placeholder="분반 이름" value={className} onChange={(e) => setClassName(e.target.value)} required />
            <input type="number" placeholder="회차 (숫자)" value={round} onChange={(e) => setRound(e.target.value)} required />
            <input type="file" accept=".pdf" onChange={handleFileChange} required />
            <button type="submit" disabled={isUploading}>
                {isUploading ? '업로드 중...' : '1. PDF 업로드하기'}
            </button>
        </form>
    );
};

export default LectureUploadForm;
