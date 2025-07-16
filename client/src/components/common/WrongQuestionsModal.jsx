import React, { useState, useEffect } from 'react';
import './WrongQuestionsModal.css';

const WrongQuestionsModal = ({ totalQuestions, initialValue, onSave, onClose }) => {
    const [textValue, setTextValue] = useState('');
    const [omrState, setOmrState] = useState([]);

    useEffect(() => {
        const numbers = (initialValue || '').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        setTextValue(numbers.join(', '));
        const maxQuestions = totalQuestions > 0 ? totalQuestions : 50;
        const newOmrState = Array(maxQuestions).fill(false);
        numbers.forEach(num => {
            if (num > 0 && num <= maxQuestions) {
                newOmrState[num - 1] = true;
            }
        });
        setOmrState(newOmrState);
    }, [initialValue, totalQuestions]);

    const handleOmrClick = (index) => {
        const newOmrState = [...omrState];
        newOmrState[index] = !newOmrState[index];
        setOmrState(newOmrState);
        updateTextFromOmr(newOmrState);
    };

    const updateTextFromOmr = (state) => {
        const wrongNumbers = state.map((isWrong, i) => isWrong ? i + 1 : null).filter(n => n !== null);
        setTextValue(wrongNumbers.join(', '));
    }

    const handleCheckAll = (check) => {
        const newOmrState = Array(omrState.length).fill(check);
        setOmrState(newOmrState);
        updateTextFromOmr(newOmrState);
    }

    const handleSave = () => {
        const wrongNumbers = omrState.map((isWrong, i) => isWrong ? i + 1 : null).filter(n => n !== null);
        // [수정] 틀린 문항 문자열과 개수를 함께 전달합니다.
        onSave(wrongNumbers.join(', '), wrongNumbers.length);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="wq-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>틀린 문항 입력</h2>
                <div className="wq-modal-body">
                    <div className="wq-left">
                        <h4>직접 입력</h4>
                        <textarea
                            value={textValue}
                            onChange={(e) => setTextValue(e.target.value)}
                            placeholder="틀린 문항 번호를 쉼표(,)로 구분하여 입력하세요. 예: 3, 7, 12"
                        />
                    </div>
                    <div className="wq-right">
                        <h4>OMR 체크 (총 {omrState.length}문항)</h4>
                        <div className="omr-grid">
                            {omrState.map((isWrong, i) => (
                                <div key={i} className={`omr-item ${isWrong ? 'wrong' : ''}`} onClick={() => handleOmrClick(i)}>
                                    <label>{i + 1}</label>
                                    <input type="checkbox" checked={isWrong} readOnly />
                                </div>
                            ))}
                        </div>
                        <div className="omr-actions">
                            <button onClick={() => handleCheckAll(true)}>일괄 체크</button>
                            <button onClick={() => handleCheckAll(false)}>일괄 해제</button>
                        </div>
                    </div>
                </div>
                <div className="wq-modal-footer">
                    <button className="modal-btn-cancel" onClick={onClose}>취소</button>
                    <button className="modal-btn-save" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default WrongQuestionsModal;
