import API from './api';

export const authService = {
  register: async (name, email, password) => {
    const response = await API.post('/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('interviewcoach_token', response.data.token);
      localStorage.setItem('interviewcoach_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('interviewcoach_token', response.data.token);
      localStorage.setItem('interviewcoach_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('interviewcoach_token');
    localStorage.removeItem('interviewcoach_user');
  },

  getCurrentUser: async () => {
    const response = await API.get('/auth/me');
    return response.data.user;
  },
};
