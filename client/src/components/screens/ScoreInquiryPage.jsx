import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import { useToast } from '../../contexts/ToastContext';
import './ScoreInquiryPage.css';

const ScoreInquiryPage = () => {
    const [classes, setClasses] = useState([]);
    const [filters, setFilters] = useState({ className: '전체 분반', round: '', studentName: '' });
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchCriteria, setSearchCriteria] = useState('');
    const { refreshKey } = useDataRefresh();
    const { showToast } = useToast();

    useEffect(() => {
        axios.get('/api/attendance/classes')
            .then(res => {
                const classList = ['전체 분반', ...res.data];
                setClasses(classList);
            })
            .catch(err => console.error(err));
    }, [refreshKey]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = useCallback(async (currentFilters) => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/scores/inquiry', { params: currentFilters });
            setResults(res.data);

            let criteria = `[${currentFilters.className}`;
            if (currentFilters.round) {
                const roundData = res.data.find(d => d.round === currentFilters.round && d.date);
                const datePart = roundData ? ` (${new Date(roundData.date).toISOString().split('T')[0]})` : '';
                criteria += ` / ${currentFilters.round}회차${datePart}`;
            }
            criteria += '] 검색 결과';
            setSearchCriteria(criteria);

        } catch (err) {
            console.error(err);
            showToast('검색 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);


    // [핵심 수정] 분반이 변경될 때마다 자동으로 검색 실행
    useEffect(() => {
        handleSearch(filters);
    }, [filters.className, handleSearch]);

    const handleSearchClick = (e) => {
        e.preventDefault();
        handleSearch(filters);
    };

    return (
        <div className="inquiry-container">
            {/* 좌측 패널: 결과 */}
            <div className="inquiry-left-panel">
                <div className="results-header">
                    <h4>{searchCriteria || '성적 조회 결과'}</h4>
                </div>
                <div className="results-table-wrapper">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>분반</th><th>회차</th><th>이름</th><th>점수</th>
                                <th>총 문항수</th><th>틀린 문항</th><th>과제1</th>
                                <th>과제2</th><th>메모</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="9">검색 결과를 불러오는 중...</td></tr>
                            ) : results.length > 0 ? (
                                results.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.class_name}</td>
                                        <td>{item.round}</td>
                                        <td>{item.student_name}</td>
                                        <td>{item.test_score}</td>
                                        <td>{item.total_question}</td>
                                        <td>{item.wrong_questions}</td>
                                        <td>{item.assignment1}</td>
                                        <td>{item.assignment2}</td>
                                        {/* [핵심 수정] 메모 셀에 툴팁과 스타일 클래스 추가 */}
                                        <td className="memo-cell" title={item.memo}>{item.memo}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9">검색 결과가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 우측 패널: 필터 */}
            <div className="inquiry-right-panel">
                <form onSubmit={handleSearchClick}>
                    <h3>성적 조회 필터</h3>
                    <div className="filter-group">
                        <label>분반 선택</label>
                        <select name="className" value={filters.className} onChange={handleFilterChange}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>회차 (선택)</label>
                        <input type="text" name="round" placeholder="회차 번호 입력 (예: 3)" value={filters.round} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-group">
                        <label>학생 이름 (선택)</label>
                        <input type="text" name="studentName" placeholder="학생 이름 입력" value={filters.studentName} onChange={handleFilterChange} />
                    </div>
                    <button type="submit" className="search-button" disabled={isLoading}>
                        {isLoading ? '검색 중...' : '검색'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScoreInquiryPage;
