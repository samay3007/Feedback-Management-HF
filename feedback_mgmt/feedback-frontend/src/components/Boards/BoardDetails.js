// src/components/Boards/BoardDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const BoardDetail = () => {
  const { boardId } = useParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    const fetchBoardAndFeedbacks = async () => {
      try {
        const [boardRes, feedbackRes] = await Promise.all([
          axiosInstance.get(`/boards/${boardId}/`),
          axiosInstance.get(`/feedback/?board=${boardId}`)
        ]);

        setBoard(boardRes.data);
        setFeedbacks(feedbackRes.data.results || feedbackRes.data);
      } catch (err) {
        console.error('Error fetching board details:', err);
      }
    };

    fetchBoardAndFeedbacks();
  }, [boardId]);

  // Optional: Handle upvote click
  const handleUpvote = async (feedbackId) => {
    try {
      await axiosInstance.post(`/feedback/${feedbackId}/upvote/`);
      // Refresh feedbacks after upvote
      const res = await axiosInstance.get(`/feedback/?board=${boardId}`);
      setFeedbacks(res.data.results || res.data);
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {board && (
          <>
            <h2 className="dashboard-title">{board.name}</h2>
            <button 
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              Back
            </button>
          </>
        )}
      </div>
      
      {board && (
        <p className="board-card-description">{board.description || 'No description provided.'}</p>
      )}
      
      <h3 className="dashboard-title">Feedbacks</h3>
      
      <div className="feedback-list">
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
                  <span className={`status-badge status-${fb.status.replace('_', '-')}`}>
                    {fb.status.replace('_', ' ')}
                  </span>
                  {fb.feedback_type && (
                    <span className={`type-badge type-${fb.feedback_type}`}>
                      {fb.feedback_type}
                    </span>
                  )}
                </div>
                <div className="upvote-button" onClick={() => handleUpvote(fb.id)}>
                  👍 {fb.upvote_count || fb.upvotes?.length || 0}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardDetail;
