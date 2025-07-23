import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './QuestionEditorPage.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function QuestionEditorPage() {
    const { materialId } = useParams();
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [material, setMaterial] = useState(null);
    const [regions, setRegions] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState(null);
    const pageRef = useRef(null);
    const { showToast } = useToast();

    const fetchMaterialData = useCallback(() => {
        api.get(`/api/materials/${materialId}`)
            .then(res => {
                setMaterial(res.data.material);
                setRegions(res.data.regions || []);
            })
            .catch(() => showToast('자료 정보를 불러오는 데 실패했습니다.', 'error'));
    }, [materialId, showToast]);

    useEffect(fetchMaterialData, [fetchMaterialData]);

    const handleMouseDown = (e) => {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        setDrawing(true);
        setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setCurrentRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
    };

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

    const handleMouseUp = () => {
        setDrawing(false);
        if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
            const lastNumber = regions.length > 0 ? Math.max(...regions.map(r => r.question_number)) : 0;
            const questionNumber = prompt('이 영역의 문제 번호를 입력하세요:', lastNumber + 1);
            if (questionNumber && !isNaN(parseInt(questionNumber))) {
                setRegions([...regions, { ...currentRect, questionNumber: parseInt(questionNumber), pageNumber }]);
            }
        }
        setCurrentRect(null);
    };

    const handleSaveRegions = async () => {
        try {
            await api.post('/api/materials/define-regions', { materialId, regions });
            showToast('문제 영역이 성공적으로 저장되었습니다.', 'success');
        } catch (error) {
            showToast('저장 중 오류가 발생했습니다.', 'error');
        }
    };

    const removeRegion = (qNumber) => {
        setRegions(regions.filter(r => r.question_number !== qNumber));
    };

    if (!material) return <div>로딩 중...</div>;

    return (
        <div className="editor-container">
            <div className="editor-viewer-wrapper" ref={pageRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                <div className="pdf-viewer">
                    <Document file={material.file_url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                    {regions.filter(r => r.pageNumber === pageNumber).map((reg, i) => (
                        <div key={i} className="region-box" style={{ left: reg.x, top: reg.y, width: reg.width, height: reg.height }}>
                            {reg.questionNumber}
                        </div>
                    ))}
                    {currentRect && <div className="region-box drawing" style={{ left: currentRect.x, top: currentRect.y, width: currentRect.width, height: currentRect.height }} />}
                </div>
            </div>
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
