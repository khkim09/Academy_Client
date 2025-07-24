import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useToast } from '../../contexts/ToastContext';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import './ScoreInquiryPage.css';

const ScoreInquiryPage = () => {
    const [classes, setClasses] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [filters, setFilters] = useState({ className: '전체 분반', roundId: '', studentName: '' });
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchCriteria, setSearchCriteria] = useState('');
    const { showToast } = useToast();
    const { refreshKey } = useDataRefresh();

    useEffect(() => {
        api.get('/api/attendance/classes')
            .then(res => setClasses(['전체 분반', ...res.data]))
            .catch(() => showToast('분반 목록을 불러오는 데 실패했습니다.', 'error'));
    }, [refreshKey, showToast]);

    useEffect(() => {
        if (filters.className && filters.className !== '전체 분반') {
            api.get(`/api/rounds/list?className=${filters.className}`)
                .then(res => setRounds(res.data))
                .catch(() => showToast('회차 목록을 불러오는 데 실패했습니다.', 'error'));
        } else {
            setRounds([]);
        }
    }, [filters.className, showToast]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, ...(name === 'className' && { roundId: '' }) }));
    };

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/scores/inquiry', { params: filters });
            setResults(res.data);
            let criteria = `[${filters.className}`;
            if (filters.roundId) {
                const roundInfo = rounds.find(r => r.id === parseInt(filters.roundId));
                criteria += ` / ${roundInfo ? `${roundInfo.round_number}회차` : filters.roundId}`;
            }
            if (filters.studentName) criteria += ` / "${filters.studentName}"`;
            criteria += '] 검색 결과';
            setSearchCriteria(criteria);
        } catch (err) {
            showToast('검색 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [filters, rounds, showToast]);

    useEffect(() => {
        handleSearch();
    }, []); // 첫 로드 시 한 번만 실행

    const handleSearchClick = (e) => {
        e.preventDefault();
        handleSearch();
    };

    return (
        <div className="inquiry-container">
            <div className="inquiry-left-panel">
                <div className="results-header"><h4>{searchCriteria || '성적 조회 결과'}</h4></div>
                <div className="results-table-wrapper">
                    <table className="results-table">
                        <thead>
                            <tr><th>분반</th><th>회차</th><th>자료명</th><th>이름</th><th>점수</th><th>총점</th><th>틀린 문항</th><th>과제1</th><th>과제2</th><th>메모</th></tr>
                        </thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan="10">검색 결과를 불러오는 중...</td></tr>
                            ) : results.length > 0 ? (
                                results.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.class_name}</td>
                                        <td>{item.round_number}</td>
                                        <td>{item.material_name || '-'}</td>
                                        <td>{item.student_name}</td>
                                        <td>{item.test_score}</td>
                                        <td>{item.total_question}</td>
                                        <td>{item.wrong_questions}</td>
                                        <td>{item.assignment1}</td>
                                        <td>{item.assignment2}</td>
                                        <td className="memo-cell" title={item.memo}>{item.memo}</td>
                                    </tr>
                                ))
                            ) : (<tr><td colSpan="10">검색 결과가 없습니다.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="inquiry-right-panel">
                <h3>검색 필터</h3>
                <form onSubmit={handleSearchClick}>
                    <div className="filter-group">
                        <label>분반 선택</label>
                        <select name="className" value={filters.className} onChange={handleFilterChange}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>회차 선택</label>
                        <select name="roundId" value={filters.roundId} onChange={handleFilterChange} disabled={filters.className === '전체 분반'}>
                            <option value="">전체 회차</option>
                            {rounds.map(r => <option key={r.id} value={r.id}>{r.round_number}회차 ({r.round_name})</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>학생 이름</label>
                        <input type="text" name="studentName" placeholder="학생 이름으로 검색" value={filters.studentName} onChange={handleFilterChange} />
                    </div>
                    <button type="submit" className="search-button" disabled={isLoading}>{isLoading ? '검색 중...' : '검색'}</button>
                </form>
            </div>
        </div>
    );
};
export default ScoreInquiryPage;
