import apiClient from './client';
import { User, UserCreate, UserLogin, Token } from '../types';

export const authApi = {
  register: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/me', userData);
    return response.data;
  },
}; 