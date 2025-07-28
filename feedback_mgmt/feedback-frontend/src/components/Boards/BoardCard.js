import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Boards.css';

const BoardCard = ({ board }) => {
  const navigate = useNavigate();

  const handleViewBoard = (e) => {
    e.stopPropagation(); // Prevent the card click event from firing
    // Navigate to table view with board ID as a query parameter
    navigate(`/table?board=${board.id}`);
  };

  const handleCardClick = () => {
    navigate(`/board/${board.id}`); // For backward compatibility
  };

  return (
    <div className="board-card" onClick={handleCardClick}>
      <div className="board-card-header">
        <h3 className="board-card-title">{board.name}</h3>
        <span className="board-card-badge">
          {board.is_private ? '🔒 Private' : '🌐 Public'}
        </span>
      </div>
      <p className="board-card-description">{board.description || 'No description provided.'}</p>
      <div className="board-card-actions">
        <button className="btn btn-primary" onClick={handleViewBoard}>View Board</button>
      </div>
    </div>
  );
};

export default BoardCard;
