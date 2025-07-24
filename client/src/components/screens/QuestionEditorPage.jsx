import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './QuestionEditorPage.css';

// PDF 렌더링을 위한 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function QuestionEditorPage() {
    // URL 파라미터에서 materialId를 가져옴 (예: /editor/12)
    const { materialId } = useParams();

    // 페이지 상태 관리
    const [numPages, setNumPages] = useState(null);       // PDF의 전체 페이지 수
    const [pageNumber, setPageNumber] = useState(1);      // 현재 보고 있는 페이지 번호
    const [material, setMaterial] = useState(null);       // 현재 자료(PDF) 정보
    const [regions, setRegions] = useState([]);           // 사용자가 그린 문제 영역 좌표 목록
    const [drawing, setDrawing] = useState(false);        // 마우스로 영역을 그리고 있는지 여부
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // 그리기 시작점 좌표
    const [currentRect, setCurrentRect] = useState(null); // 현재 그리고 있는 사각형 정보

    const pageRef = useRef(null); // PDF 페이지 컴포넌트의 DOM 요소를 참조하기 위한 ref
    const { showToast } = useToast();

    // 서버에서 강의 자료 정보와 저장된 문제 영역 정보를 불러오는 함수
    const fetchMaterialData = useCallback(() => {
        api.get(`/api/materials/${materialId}`)
            .then(res => {
                setMaterial(res.data.material);
                setRegions(res.data.regions || []);
            })
            .catch(() => showToast('자료 정보를 불러오는 데 실패했습니다.', 'error'));
    }, [materialId, showToast]);

    useEffect(fetchMaterialData, [fetchMaterialData]);

    // 마우스 버튼을 눌렀을 때: 그리기 시작
    const handleMouseDown = (e) => {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        setDrawing(true);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({ x, y });
        setCurrentRect({ x, y, width: 0, height: 0 });
    };

    // 마우스를 움직일 때: 현재 그리는 사각형 크기 업데이트
    const handleMouseMove = (e) => {
        if (!drawing || !pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        setCurrentRect({
            x: Math.min(startPoint.x, currentX),
            y: Math.min(startPoint.y, currentY),
            width: Math.abs(currentX - startPoint.x),
            height: Math.abs(currentY - startPoint.y),
        });
    };

    // 마우스 버튼을 뗐을 때: 그리기 종료 및 영역 정보 저장
    const handleMouseUp = () => {
        setDrawing(false);
        // 너무 작은 영역은 무시
        if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
            const lastNumber = regions.length > 0 ? Math.max(...regions.map(r => r.question_number)) : 0;
            const questionNumber = prompt('이 영역의 문제 번호를 입력하세요:', lastNumber + 1);
            if (questionNumber && !isNaN(parseInt(questionNumber))) {
                setRegions([...regions, { ...currentRect, questionNumber: parseInt(questionNumber), pageNumber }]);
            }
        }
        setCurrentRect(null); // 현재 그리던 사각형 초기화
    };

    // '모든 영역 저장' 버튼 클릭 시 서버로 전송
    const handleSaveRegions = async () => {
        try {
            await api.post('/api/materials/define-regions', { materialId, regions });
            showToast('문제 영역이 성공적으로 저장되었습니다.', 'success');
        } catch (error) {
            showToast('저장 중 오류가 발생했습니다.', 'error');
        }
    };

    // 목록에서 특정 문제 영역을 삭제하는 함수
    const removeRegion = (qNumber) => {
        setRegions(regions.filter(r => r.question_number !== qNumber));
    };

    if (!material) return <div>자료를 불러오는 중입니다...</div>;

    return (
        <div className="editor-container">
            {/* PDF 뷰어 영역 */}
            <div className="editor-viewer-wrapper" ref={pageRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                <div className="pdf-viewer">
                    <Document file={material.file_url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                    {/* 현재 페이지에 해당하는 저장된 영역들 표시 */}
                    {regions.filter(r => r.pageNumber === pageNumber).map((reg, i) => (
                        <div key={i} className="region-box" style={{ left: reg.x, top: reg.y, width: reg.width, height: reg.height }}>
                            {reg.question_number}
                        </div>
                    ))}
                    {/* 현재 그리고 있는 영역 실시간으로 표시 */}
                    {currentRect && <div className="region-box drawing" style={{ left: currentRect.x, top: currentRect.y, width: currentRect.width, height: currentRect.height }} />}
                </div>
            </div>
            {/* 사이드바: 컨트롤 및 영역 목록 */}
            <div className="editor-sidebar">
                <h3>문제 영역 목록</h3>
                <div className="page-controls">
                    <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>이전 페이지</button>
                    <span>Page {pageNumber} of {numPages}</span>
                    <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>다음 페이지</button>
                </div>
                <div className="region-list">
                    {regions.sort((a, b) => a.question_number - b.question_number).map(reg => (
                        <div key={reg.question_number} className="region-item">
                            <span>{reg.question_number}번 (p.{reg.pageNumber})</span>
                            <button onClick={() => removeRegion(reg.question_number)}>삭제</button>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveRegions} className="save-all-btn">모든 영역 저장</button>
            </div>
        </div>
    );
}

export default QuestionEditorPage;
