import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import './Dashboard.css';
import { addComment, fetchComments } from '../../api/comments';
import axiosInstance from '../../api/axiosInstance';

const RedditStyle = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
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
    fetchTags();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchFeedbacksAndComments(selectedBoard, selectedTagFilter);
    }
  }, [selectedBoard, selectedTagFilter]);

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

  const fetchTags = async () => {
    try {
      const res = await axiosInstance.get('/tags/');
      const tagList = res.data.results || res.data;
      setTags(tagList);
    } catch (err) {
      console.error('Failed to fetch tags:', err.response?.data || err);
    }
  };

  const fetchFeedbacksAndComments = async (boardId, tagId = '') => {
    setLoading(true);
    try {
      let url = `/feedback/?board=${boardId}`;
      if (tagId) url += `&tag=${tagId}`;
      const res = await axios.get(url);
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
      fetchFeedbacksAndComments(selectedBoard, selectedTagFilter);
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
        tag_ids: selectedTags, // send tag IDs
      });

      setNewFeedback({ title: '', description: '', feedback_type: 'bug' });
      setSelectedTags([]);
      fetchFeedbacksAndComments(selectedBoard, selectedTagFilter);
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
      fetchFeedbacksAndComments(selectedBoard, selectedTagFilter);
    } catch (err) {
      console.error('Error adding comment:', err.response?.data || err);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const tagName = newTag.trim();

    // Check if tag already exists (case-insensitive)
    const existing = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    if (existing) {
      if (!selectedTags.includes(existing.id)) {
        setSelectedTags(prev => [...prev, existing.id]);
      }
      setNewTag('');
      return;
    }

    try {
      const res = await axiosInstance.post('/tags/', { name: tagName });
      const newTagData = res.data;
      setTags(prev => [...prev, newTagData]);

      if (!selectedTags.includes(newTagData.id)) {
        setSelectedTags(prev => [...prev, newTagData.id]);
      }

      setNewTag('');
    } catch (err) {
      if (err.response?.data?.name?.[0]?.includes('already exists')) {
        try {
          const res = await axiosInstance.get('/tags/');
          const tagList = res.data.results || res.data;
          const existingAgain = tagList.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());

          if (existingAgain && !selectedTags.includes(existingAgain.id)) {
            setSelectedTags(prev => [...prev, existingAgain.id]);
          }
          setTags(tagList);
        } catch (fetchErr) {
          console.error('Error fetching tags after duplicate creation:', fetchErr);
        }
      } else {
        console.error('Error creating tag:', err.response?.data || err);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Feedback Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="board-selector"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="board-selector"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="feedback-item">
        <h3>Create New Feedback</h3>
        <input
          type="text"
          placeholder="Title"
          className="form-control"
          value={newFeedback.title}
          onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
        />
        <textarea
          placeholder="Description"
          className="form-control"
          value={newFeedback.description}
          onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
        />
        <select
          className="form-control"
          value={newFeedback.feedback_type}
          onChange={(e) => setNewFeedback({ ...newFeedback, feedback_type: e.target.value })}
        >
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="suggestion">Suggestion</option>
        </select>

        <div className="form-group">
          <label>Tags:</label>
          <select
            multiple
            className="form-control"
            value={selectedTags}
            onChange={(e) =>
              setSelectedTags(
                Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value))
              )
            }
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          <div className="add-tag-form" style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              placeholder="New tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="form-control"
            />
            <button onClick={handleAddTag} className="btn-small">Add Tag</button>
          </div>
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
                <span> | <strong>By:</strong> {fb.created_by?.username || 'Unknown'}</span>
                {fb.tags?.length > 0 && (
                  <div className="tag-container">
                    {fb.tags.map((tag) => {
                      const tagName = typeof tag === 'object' ? tag.name : tags.find(t => t.id === tag)?.name;
                      return (
                        <span key={typeof tag === 'object' ? tag.id : tag} className="feedback-tag-label">
                          #{tagName || 'Unknown'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleUpvote(fb.id)}
                className="upvote-button"
                disabled={upvoting === fb.id}
              >
                👍 {fb.upvote_count}
              </button>
            </div>

            <div className="comments-section">
              <h4>Comments</h4>
              {(comments[fb.id] || []).map(c => (
                <div key={c.id} className="comment">
                  <strong>{c.created_by?.username || c.created_by?.email || 'User'}:</strong> {c.content}
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
