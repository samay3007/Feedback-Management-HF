// src/components/Dashboard/RedditStyle.js
import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import './Dashboard.css';
import { addComment, fetchComments } from '../../api/comments';

const RedditStyle = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [loading, setLoading] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    feedback_type: 'bug',
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [upvoting, setUpvoting] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchFeedbacksAndComments(selectedBoard);
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      const res = await axios.get('/boards/');
      const boardList = res.data.results || [];
      setBoards(boardList);
      setSelectedBoard(boardList[0]?.id || '');
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  };

  const fetchFeedbacksAndComments = async (boardId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/feedback/?board=${boardId}`);
      const feedbackList = res.data.results || [];
      setFeedbacks(feedbackList);

      const commentPromises = feedbackList.map((fb) =>
        fetchComments(fb.id).then((comments) => ({
          feedbackId: fb.id,
          comments,
        }))
      );

      const commentsData = await Promise.all(commentPromises);
      const allComments = {};
      commentsData.forEach(({ feedbackId, comments }) => {
        allComments[feedbackId] = comments.results || [];
      });

      setComments(allComments);
    } catch (err) {
      console.error('Error fetching feedbacks or comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id) => {
    setUpvoting(id);
    try {
      await axios.post(`/feedback/${id}/upvote/`);
      fetchFeedbacksAndComments(selectedBoard);
    } catch (err) {
      console.error('Error upvoting:', err);
    } finally {
      setUpvoting(null);
    }
  };

  const handleCreateFeedback = async () => {
    if (!newFeedback.title.trim() || !newFeedback.description.trim()) return;

    try {
      await axios.post('/feedback/', {
        ...newFeedback,
        board: selectedBoard,
        tags: [],
      });
      setNewFeedback({ title: '', description: '', feedback_type: 'bug' });
      fetchFeedbacksAndComments(selectedBoard);
    } catch (err) {
      console.error('Error creating feedback:', err.response?.data || err);
    }
  };

  const handleAddComment = async (feedbackId) => {
    const text = newComment[feedbackId]?.trim();
    if (!text) return;

    try {
      await addComment(feedbackId, text);
      setNewComment((prev) => ({ ...prev, [feedbackId]: '' }));
      fetchFeedbacksAndComments(selectedBoard);
    } catch (err) {
      console.error('Error adding comment:', err.response?.data || err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Feedback Dashboard</h2>
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
          <p>Loading boards...</p>
        )}
      </div>

      {/* Feedback Form */}
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
        <button onClick={handleCreateFeedback} className="btn-primary">
          Submit Feedback
        </button>
      </div>

      <h3 className="dashboard-title" style={{ marginTop: '2rem' }}>Feedback Items</h3>

      {loading ? (
        <p>Loading feedbacks...</p>
      ) : feedbacks.length === 0 ? (
        <p>No feedbacks available for this board.</p>
      ) : (
        feedbacks.map((fb) => (
          <div key={fb.id} className="feedback-item">
            <h3>{fb.title}</h3>
            <p>{fb.description}</p>
            <div className="feedback-meta">
              <div>
                <span className="feedback-tag">{fb.feedback_type}</span>
                <span> | Board: {fb.board_name || fb.board}</span>
              </div>
              <button
                onClick={() => handleUpvote(fb.id)}
                className="upvote-button"
                disabled={upvoting === fb.id}
              >
                👍 {fb.upvote_count}
              </button>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <h4>Comments</h4>
              {(Array.isArray(comments[fb.id]) ? comments[fb.id] : []).map(c => (
                <div key={c.id} className="comment">
                  <strong>{c.created_by?.username || 'User'}:</strong> {c.content}
                </div>
              ))}
              <div className="comment-form">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment[fb.id] || ''}
                  onChange={(e) =>
                    setNewComment((prev) => ({ ...prev, [fb.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(fb.id);
                  }}
                />
                <button onClick={() => handleAddComment(fb.id)}>Post</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RedditStyle;
