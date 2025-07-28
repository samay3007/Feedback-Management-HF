import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import BoardCard from './BoardCard';
import './Boards.css';

const UserBoardsPage = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = async () => {
    try {
      const res = await axios.get('/boards/');
      if (Array.isArray(res.data.results)) {
        setBoards(res.data.results);
      } else {
        setBoards([]);
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="boards-container">
      <div className="boards-header">
        <h2 className="boards-title">Explore Boards</h2>
      </div>

      {loading ? (
        <p>Loading boards...</p>
      ) : boards.length === 0 ? (
        <p>No boards available.</p>
      ) : (
        <div className="board-grid">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBoardsPage;
