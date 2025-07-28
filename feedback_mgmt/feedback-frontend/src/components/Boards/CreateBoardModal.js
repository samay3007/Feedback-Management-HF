// src/components/Boards/CreateBoardModal.js
import React from 'react';
import './Boards.css';

const CreateBoardModal = ({ isOpen, onClose, formData, setFormData, onCreate }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(); // formData is already in parent state
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create New Board</h2>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Board Name</label>
            <input
              type="text"
              placeholder="Enter board name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Enter board description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="form-control"
              rows="4"
            />
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="is-public"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
            />
            <label htmlFor="is-public" className="form-label">Public Board</label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Board</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
