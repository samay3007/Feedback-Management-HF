// api/tags.js

import axiosInstance from './axiosInstance';

export const getTags = async () => {
  const response = await axiosInstance.get('/tags/');
  return response.data;
};
