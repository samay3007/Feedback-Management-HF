// src/components/Boards/BoardsPage.js
import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import CreateBoardModal from './CreateBoardModal';
import './Boards.css';

const BoardsPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin' || user?.isSuperuser === true;

  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
  });

  const [memberInputs, setMemberInputs] = useState({});

  const fetchBoards = () => {
    setLoading(true);
    axiosInstance.get('/boards/')
      .then(res => {
        setBoards(res.data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchFeedbacks = (boardId) => {
    axiosInstance.get(`/feedback/?board=${boardId}`)
      .then(res => setFeedbacks(res.data.results || []))
      .catch(() => setFeedbacks([]));
  };

  const handleBoardClick = (boardId) => {
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null);
      setFeedbacks([]);
    } else {
      setSelectedBoardId(boardId);
      fetchFeedbacks(boardId);
    }
  };

  const handleCreateBoard = () => {
    if (!formData.name.trim()) {
      alert('Board name is required');
      return;
    }

    axiosInstance.post('/boards/', formData)
      .then(() => {
        fetchBoards();
        setShowModal(false);
        setFormData({ name: '', description: '', is_public: true });
      })
      .catch(err => {
        alert('Failed to create board: ' + (err.response?.data?.detail || err.message));
      });
  };

  const handleAddMember = (boardId) => {
    const username = memberInputs[boardId]?.trim();
    if (!username) {
      alert('Enter username');
      return;
    }

    axiosInstance.post(`/boards/${boardId}/add-member/`, { username })
      .then(() => {
        alert('User added to board');
        setMemberInputs(prev => ({ ...prev, [boardId]: '' }));
        fetchBoards();
      })
      .catch(err => {
        alert('Failed to add member: ' + (err.response?.data?.detail || err.message));
      });
  };

  const handleDeleteBoard = (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;

    axiosInstance.delete(`/boards/${boardId}/`)
      .then(() => {
        if (selectedBoardId === boardId) {
          setSelectedBoardId(null);
          setFeedbacks([]);
        }
        fetchBoards();
      })
      .catch(err => alert('Failed to delete board'));
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="boards-container">
      <div className="boards-header">
        <h2 className="boards-title">Boards</h2>

        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="create-board-button">
            + Create Board
          </button>
        )}
      </div>

      <CreateBoardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        onCreate={handleCreateBoard}
      />

      <h3 className="dashboard-title">Available Boards</h3>

      {loading ? (
        <p>Loading boards...</p>
      ) : boards.length === 0 ? (
        <p>No boards found.</p>
      ) : (
        <div className="board-grid">
          {boards.map(board => (
            <div key={board.id} className="board-card">
              <div className="board-card-header">
                <h4
                  onClick={() => handleBoardClick(board.id)}
                  className="board-card-title"
                >
                  {board.name}
                </h4>
                <span className="board-card-badge">
                  {board.is_public ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>
              <p className="board-card-description">{board.description || 'No description'}</p>

              {!board.is_public && (
                <div className="board-card-members">
                  {isAdmin ? (
                    <div className="member-input-group">
                      <input
                        placeholder="Add member by username"
                        value={memberInputs[board.id] || ''}
                        onChange={e =>
                          setMemberInputs(prev => ({
                            ...prev,
                            [board.id]: e.target.value
                          }))
                        }
                        className="member-input"
                      />
                      <button 
                        onClick={() => handleAddMember(board.id)}
                        className="add-member-button"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <div>
                      <strong>Members:</strong>{' '}
                      {board.members?.map(m => m.username).join(', ') || 'No members'}
                    </div>
                  )}
                </div>
              )}

              <div className="board-card-actions">
                <button 
                  onClick={() => handleBoardClick(board.id)}
                  className="btn btn-secondary"
                >
                  {selectedBoardId === board.id ? 'Hide Details' : 'View Details'}
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteBoard(board.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                )}
              </div>

              {selectedBoardId === board.id && (
                <div className="feedback-list">
                  <h5 className="dashboard-title">Feedbacks:</h5>
                  {feedbacks.length === 0 ? (
                    <p>No feedbacks available.</p>
                  ) : (
                    <div>
                      {feedbacks.map(fb => (
                        <div key={fb.id} className="feedback-list-item">
                          <span className="feedback-list-title">{fb.title}</span>
                          <div className="feedback-list-meta">
                            <span className={`feedback-list-status status-${fb.status.replace('_', '-')}`}>
                              {fb.status}
                            </span>
                            <span>👍 {fb.upvote_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardsPage;
