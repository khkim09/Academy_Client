import React, { useState } from 'react';
import LectureUploadForm from '../components/lecture/LectureUploadForm'; // 곧 생성할 컴포넌트
import QuestionEditor from '../components/lecture/QuestionEditor'; // 곧 생성할 컴포넌트

function LectureAdminPage() {
    const [uploadedMaterial, setUploadedMaterial] = useState(null);

    // PDF 업로드 성공 시 QuestionEditor를 보여주기 위한 상태 업데이트 함수
    const handleUploadSuccess = (materialData) => {
        setUploadedMaterial(materialData);
    };

    return (
        <div className="page-container">
            <h1>강의 자료 관리</h1>
            {!uploadedMaterial ? (
                <LectureUploadForm onUploadSuccess={handleUploadSuccess} />
            ) : (
                <QuestionEditor material={uploadedMaterial} />
            )}
        </div>
    );
};

export default LectureAdminPage;
