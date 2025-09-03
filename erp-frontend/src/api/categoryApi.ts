import apiClient from './httpClient';

export const getCategories = async () => {
  const res = await apiClient.get('/categories');
  return res.data;
};
