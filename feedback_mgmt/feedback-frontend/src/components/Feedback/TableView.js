// src/components/Feedback/TableView.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import FeedbackTable from './FeedbackTable';
import '../Dashboard/Dashboard.css';
import './Table.css';

const TableView = () => {
    const [boards, setBoards] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const location = useLocation();

    // Fetch boards once
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await axiosInstance.get('/boards/');
                setBoards(res.data.results);
                
                // Check for board ID in URL query parameters
                const params = new URLSearchParams(location.search);
                const boardId = params.get('board');
                
                if (boardId) {
                    // Set the selected board from URL parameter
                    setSelectedBoard(boardId);
                } else if (res.data.results.length > 0) {
                    // Default to first board if no parameter is provided
                    setSelectedBoard(res.data.results[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch boards', err);
            }
        };
        fetchBoards();
    }, [location]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">Feedback Table View</h2>
                <select
                    className="board-selector"
                    value={selectedBoard || ''}
                    onChange={e => setSelectedBoard(e.target.value)}
                >
                    {boards.map(board => (
                        <option key={board.id} value={board.id}>
                            Switch Board: {board.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedBoard && <FeedbackTable selectedBoard={selectedBoard} />}
        </div>
    );
};

export default TableView;