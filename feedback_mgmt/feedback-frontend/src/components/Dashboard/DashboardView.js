// src/components/Dashboard/DashboardView.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement
);

const DashboardView = () => {
    const [boards, setBoards] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [summary, setSummary] = useState({
        total: 0,
        open: 0,
        in_progress: 0,
        completed: 0,
        trending: [],
        topVoted: null,
        statusDistribution: {},
    });

    // Fetch boards once
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await axiosInstance.get('/boards/');
                setBoards(res.data.results);
                if (res.data.results.length > 0) {
                    setSelectedBoard(res.data.results[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch boards', err);
            }
        };
        fetchBoards();
    }, []);

    // Fetch dashboard data when selectedBoard changes
    useEffect(() => {
        if (!selectedBoard) return;

        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`/feedback/?board=${selectedBoard}&page_size=1000`);
                const feedbacks = res.data.results;

                const total = res.data.count;
                const open = feedbacks.filter(fb => fb.status === 'open').length;
                const in_progress = feedbacks.filter(fb => fb.status === 'in_progress').length;
                const completed = feedbacks.filter(fb => fb.status === 'completed').length;

                const sortedByVotes = [...feedbacks].sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0));
                const topVoted = sortedByVotes[0] || null;

                let dateCounts = {};
                const now = new Date();
                const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
                for (let d = new Date(past); d <= now; d.setDate(d.getDate() + 1)) {
                    const key = d.toISOString().split('T')[0];
                    dateCounts[key] = 0;
                }
                feedbacks.forEach(fb => {
                    const dateKey = fb.created_at.split('T')[0];
                    if (dateKey in dateCounts) dateCounts[dateKey]++;
                });
                const trending = Object.entries(dateCounts).map(([date, count]) => ({ date, count }));

                const statusCountMap = { open, in_progress, completed };

                setSummary({
                    total,
                    open,
                    in_progress,
                    completed,
                    trending,
                    topVoted,
                    statusDistribution: statusCountMap,
                });
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            }
        };

        fetchData();
    }, [selectedBoard]);

    const trendingData = {
        labels: summary.trending.map(d => d.date),
        datasets: [
            {
                label: 'Feedback submissions',
                data: summary.trending.map(d => d.count),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const statusData = {
        labels: Object.keys(summary.statusDistribution),
        datasets: [{
            label: '# Feedback by Status',
            data: Object.values(summary.statusDistribution),
            backgroundColor: [
                'rgba(255, 99, 132,0.5)',
                'rgba(54, 162, 235,0.5)',
                'rgba(75, 192, 192,0.5)',
            ],
        }]
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">Dashboard</h2>
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

            {/* Metrics */}
            <div className="cards-grid">
                <div className="stat-card">
                    <h3>Total Feedback</h3>
                    <p>{summary.total}</p>
                </div>
                <div className="stat-card">
                    <h3>Open</h3>
                    <p>{summary.open}</p>
                </div>
                <div className="stat-card">
                    <h3>In Progress</h3>
                    <p>{summary.in_progress}</p>
                </div>
                <div className="stat-card">
                    <h3>Completed</h3>
                    <p>{summary.completed}</p>
                </div>
            </div>

            {/* Top voted feedback */}
            <div>
                <h3 className="dashboard-title">Top Voted Feedback</h3>
                {summary.topVoted ? (
                    <div className="feedback-item">
                        <h3>{summary.topVoted.title}</h3>
                        <p>{summary.topVoted.description || 'No description'}</p>
                        <div className="feedback-meta">
                            <div>
                                <span className="feedback-tag">{summary.topVoted.status}</span>
                            </div>
                            <button className="upvote-button">
                                👍 {summary.topVoted.upvote_count}
                            </button>
                        </div>
                    </div>
                ) : <p>No feedback yet.</p>}
            </div>

            {/* Charts */}
            <div className="charts-container">
                <div className="chart-card">
                    <h3>Submission Trends (Last 30 days)</h3>
                    <Line data={trendingData} />
                </div>
                <div className="chart-card">
                    <h3>Status Distribution</h3>
                    <Bar data={statusData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
