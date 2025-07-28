// src/components/Dashboard/RedditStyle.js
import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import './Dashboard.css';

const RedditStyle = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    feedback_type: 'bug', // or 'feature', 'idea'
  });

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchFeedbacks(selectedBoard);
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      const res = await axios.get('/boards/');
      if (Array.isArray(res.data.results)) {
        setBoards(res.data.results);
        setSelectedBoard(res.data.results[0]?.id || '');
      } else {
        setBoards([]);
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  };

  const fetchFeedbacks = async (boardId) => {
    try {
      const res = await axios.get(`/feedback/?board=${boardId}`);
      if (Array.isArray(res.data.results)) {
        setFeedbacks(res.data.results);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const handleUpvote = async (id) => {
    try {
      await axios.post(`/feedback/${id}/upvote/`);
      fetchFeedbacks(selectedBoard);
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  const handleCreateFeedback = async () => {
  try {
    await axios.post('/feedback/', {
      ...newFeedback,
      board: selectedBoard,
      tags: []  // 🔧 Fix: Add empty tags list explicitly
    });
    setNewFeedback({ title: '', description: '', feedback_type: 'bug' });
    fetchFeedbacks(selectedBoard);
  } catch (err) {
    console.error('Error creating feedback:', err.response?.data || err);
  }
};


  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Development</h2>
        {boards.length > 0 ? (
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="board-selector"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                Switch Board: {board.name}
              </option>
            ))}
          </select>
        ) : (
          <p>No boards available.</p>
        )}
      </div>

      {/* Feedback creation form */}
      <div className="feedback-item">
        <h3>Create New Feedback</h3>
        <div className="form-group">
          <input
            type="text"
            placeholder="Title"
            className="form-control"
            value={newFeedback.title}
            onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <textarea
            placeholder="Description"
            className="form-control"
            value={newFeedback.description}
            onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <select
            className="form-control"
            value={newFeedback.feedback_type}
            onChange={(e) => setNewFeedback({ ...newFeedback, feedback_type: e.target.value })}
          >
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="idea">Idea</option>
          </select>
        </div>
        <button
          onClick={handleCreateFeedback}
          className="btn-primary"
        >
          Submit Feedback
        </button>
      </div>

      <h3 className="dashboard-title" style={{ marginTop: '2rem' }}>Feedback Items</h3>
      
      {feedbacks.length === 0 ? (
        <p>No feedbacks available for this board.</p>
      ) : (
        feedbacks.map((fb) => (
          <div
            key={fb.id}
            className="feedback-item"
          >
            <h3>{fb.title}</h3>
            <p>{fb.description}</p>
            <div className="feedback-meta">
              <div>
                <span className="feedback-tag">{fb.feedback_type}</span>
                <span>Board: {fb.board_name || fb.board}</span>
              </div>
              <button
                onClick={() => handleUpvote(fb.id)}
                className="upvote-button"
              >
                👍 {fb.upvote_count}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RedditStyle;
