import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useTable, useSortBy, usePagination, useFilters } from 'react-table';
import './Table.css';
import '../Dashboard/Dashboard.css';

const FeedbackTable = ({ selectedBoard }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [tagsList, setTagsList] = useState([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy] = useState([]);

    const [filterValues, setFilterValues] = useState({
        status: '',
        feedback_type: '',
        board: selectedBoard || '',
        tags: ''
    });

    useEffect(() => {
        if (selectedBoard) {
            setFilterValues(prev => ({ ...prev, board: selectedBoard }));
        }
    }, [selectedBoard]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const columns = useMemo(() => [
        {
            Header: 'Title',
            accessor: 'title',
        },
        {
            Header: 'Status',
            accessor: 'status',
            Cell: ({ value }) => {
                const statusClass = `status-badge status-${value.replace('_', '-')}`;
                return <span className={statusClass}>{value.replace('_', ' ')}</span>;
            }
        },
        {
            Header: 'Type',
            accessor: 'feedback_type',
            Cell: ({ value }) => {
                const typeClass = `type-badge type-${value}`;
                return <span className={typeClass}>{value}</span>;
            }
        },
        {
            Header: 'Upvotes',
            accessor: 'upvote_count',
            Cell: ({ value }) => (
                <div className="upvote-count">
                    <span className="upvote-icon">👍</span>
                    <span>{value}</span>
                </div>
            )
        },
        {
            Header: 'Tags',
            accessor: 'tags',
            Cell: ({ value }) => (
                <div className="tags-list">
                    {Array.isArray(value) && value.length > 0
                        ? value.map((tag) => (
                            <span key={`tag-${tag.id ?? tag.name ?? Math.random()}`} className="tag">{tag.name}</span>
                        ))
                    : '—'}
                </div>
            )
        },
        {
            Header: 'Created At',
            accessor: 'created_at',
            Cell: ({ value }) => formatDate(value)
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
    } = useTable(
        {
            columns,
            data,
            manualPagination: true,
            pageCount,
            manualSortBy: true,
            manualFilters: true,
            initialState: { pageIndex, pageSize },
            useControlledState: state => ({
                ...state,
                pageIndex,
                pageSize,
                sortBy,
            }),
        },
        useFilters,
        useSortBy,
        usePagination,
    );

    useEffect(() => {
        setLoading(true);
        let sort_param = '';
        if (sortBy.length > 0) {
            const s = sortBy[0];
            sort_param = (s.desc ? '-' : '') + s.id;
        }

        let filterParams = '';
        if (filterValues.status) filterParams += `&status=${filterValues.status}`;
        if (filterValues.feedback_type) filterParams += `&feedback_type=${filterValues.feedback_type}`;
        if (filterValues.board) filterParams += `&board=${filterValues.board}`;
        if (filterValues.tags) filterParams += `&tags=${filterValues.tags}`;

        axiosInstance.get(`/feedback/?page=${pageIndex + 1}&page_size=${pageSize}&ordering=${sort_param}${filterParams}`)
            .then(res => {
                setData(res.data.results);
                setPageCount(Math.ceil(res.data.count / pageSize));
                setTotalCount(res.data.count);
                setLoading(false);
            })
            .catch(_ => setLoading(false));
    }, [pageIndex, pageSize, sortBy, filterValues]);

    useEffect(() => {
        axiosInstance.get('/tags/')
            .then(res => {
                const results = Array.isArray(res.data?.results) ? res.data.results : res.data;
                setTagsList(results);
            })
            .catch(err => {
                console.error('Failed to load tags:', err);
                setTagsList([]);
            });
    }, []);

    const handleFilterChange = (key, value) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
        setPageIndex(0); // Reset to first page on filter change
    };

    return (
        <div className="table-container">
            <div className="table-header">
                <h2 className="table-title">Feedback Table (Total: {totalCount})</h2>
            </div>

            <div className="table-filters">
                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select 
                        className="filter-select"
                        value={filterValues.status}
                        onChange={e => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label className="filter-label">Type</label>
                    <select 
                        className="filter-select"
                        value={filterValues.feedback_type}
                        onChange={e => handleFilterChange('feedback_type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                        <option value="suggestion">Suggestion</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Tags</label>
                    <select
                        className="filter-select"
                        value={filterValues.tags}
                        onChange={e => handleFilterChange('tags', e.target.value)}
                    >
                        <option value="">All Tags</option>
                        {tagsList.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <table {...getTableProps()} className="feedback-table">
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                            {headerGroup.headers.map(column => (
                                <th
                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                    key={column.id}
                                >
                                    {column.render('Header')}
                                    <span className="sort-indicator">
                                        {column.isSorted ? (column.isSortedDesc ? '↓' : '↑') : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>

                <tbody {...getTableBodyProps()}>
                    {loading ? (
                        <tr>
                            <td colSpan={columns.length} className="loading-indicator">Loading...</td>
                        </tr>
                    ) : page.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="empty-state">No feedback items found</td>
                        </tr>
                    ) : (
                        page.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()} key={row.id}>
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()} key={cell.column.id}>
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            <div className="table-pagination">
                <div className="pagination-controls">
                    <button 
                        className="pagination-button"
                        onClick={() => setPageIndex(old => Math.max(old - 1, 0))} 
                        disabled={pageIndex === 0}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page <strong>{pageIndex + 1}</strong> of {pageCount}
                    </span>
                    <button 
                        className="pagination-button"
                        onClick={() => setPageIndex(old => (old + 1 < pageCount ? old + 1 : old))} 
                        disabled={pageIndex + 1 >= pageCount}
                    >
                        Next
                    </button>
                </div>

                <div>
                    <select
                        className="page-size-select"
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            setPageIndex(0);
                        }}
                    >
                        {[10, 20, 30, 40, 50].map(size => (
                            <option key={size} value={size}>
                                Show {size} per page
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FeedbackTable;
