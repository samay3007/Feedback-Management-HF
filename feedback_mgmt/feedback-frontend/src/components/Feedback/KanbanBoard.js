import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import '../Dashboard/Dashboard.css';
import '../Boards/Boards.css';

const statuses = [
  { key: 'open', title: 'Open' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'completed', title: 'Completed' },
];

const KanbanBoard = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [columns, setColumns] = useState({ open: [], in_progress: [], completed: [] });
  const [loading, setLoading] = useState(false);

  const fetchBoards = async () => {
    try {
      const res = await axiosInstance.get('/boards/');
      setBoards(res.data.results);
      if (res.data.results.length > 0) {
        setSelectedBoardId(res.data.results[0].id); // Default to first board
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  };

  const fetchFeedbacks = async (boardId) => {
    if (!boardId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/feedback/?board=${boardId}`);
      const grouped = { open: [], in_progress: [], completed: [] };
      res.data.results.forEach(item => {
        grouped[item.status].push(item);
      });
      setColumns(grouped);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      fetchFeedbacks(selectedBoardId);
      if (!isAdmin) {
        const interval = setInterval(() => fetchFeedbacks(selectedBoardId), 15000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedBoardId, isAdmin]);

  const onDragEnd = (result) => {
    if (!isAdmin) return;

    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceItems = Array.from(columns[source.droppableId]);
    const [moved] = sourceItems.splice(source.index, 1);

    const destItems = Array.from(columns[destination.droppableId]);
    destItems.splice(destination.index, 0, moved);

    setColumns(prev => ({
      ...prev,
      [source.droppableId]: sourceItems,
      [destination.droppableId]: destItems,
    }));

    axiosInstance.post(`/feedback/${draggableId}/move/`, {
      status: destination.droppableId
    }).catch(() => {
      alert('Failed to move feedback. Reverting.');
      fetchFeedbacks(selectedBoardId);
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Kanban Board</h2>
        {boards.length > 0 && (
          <select
            className="board-selector"
            value={selectedBoardId || ''}
            onChange={(e) => setSelectedBoardId(Number(e.target.value))}
          >
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                Switch Board: {board.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p>Loading feedbacks...</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-container">
            {statuses.map(status => (
              <Droppable droppableId={status.key} key={status.key} isDropDisabled={!isAdmin}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="kanban-column"
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? '#e0f2fe' : '#f5f5f5',
                    }}
                  >
                    <div className="kanban-column-header">{status.title}</div>
                    <div className="kanban-items">
                      {columns[status.key].map((item, index) => (
                        <Draggable
                          key={item.id.toString()}
                          draggableId={item.id.toString()}
                          index={index}
                          isDragDisabled={!isAdmin}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="kanban-item"
                              style={{
                                backgroundColor: snapshot.isDragging ? '#4285f4' : 'white',
                                color: snapshot.isDragging ? 'white' : 'inherit',
                                ...provided.draggableProps.style,
                              }}
                            >
                              <h4>{item.title}</h4>
                              <div className="kanban-item-meta">
                                <span>{item.feedback_type}</span>
                                <span>👍 {item.upvote_count || 0}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default KanbanBoard;
