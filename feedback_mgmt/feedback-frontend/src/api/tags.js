// api/tags.js//bug-fix
// feedback_mgmt/feedback-frontend/src/api/tags.js
// This file handles API requests related to tags
import axiosInstance from './axiosInstance';

export const getTags = async () => {
  const response = await axiosInstance.get('/tags/');
  return response.data;
};
