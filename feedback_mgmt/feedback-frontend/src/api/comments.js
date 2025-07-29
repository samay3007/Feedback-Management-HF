import axiosInstance from './axiosInstance';

export const fetchComments = async (feedbackId) => {
  try {
    const response = await axiosInstance.get(`/comments/?feedback=${feedbackId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comments', error);
    return { results: [] };
  }
};

export const addComment = async (feedbackId, content) => {
  try {
    const response = await axiosInstance.post(`/comments/`, {
      feedback: feedbackId,
      content: content,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add comment', error);
    throw error;
  }
};
