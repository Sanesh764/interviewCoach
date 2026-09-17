import API from './api';

export const interviewService = {
  // Create and initialize new interview
  createInterview: async (data) => {
    const response = await API.post('/interviews', data);
    return response.data;
  },

  // Get interview by ID
  getInterview: async (id) => {
    const response = await API.get(`/interviews/${id}`);
    return response.data;
  },

  // Submit typed answer in text mode
  submitTextAnswer: async (id, answer) => {
    const response = await API.post(`/interviews/${id}/answer`, { answer });
    return response.data;
  },

  // Submit voice recording
  submitVoiceAnswer: async (id, audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const response = await API.post(`/interviews/${id}/voice-answer`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Switch between text and voice modes mid-interview
  switchMode: async (id, mode) => {
    const response = await API.patch(`/interviews/${id}/mode`, { mode });
    return response.data;
  },

  // Complete interview session and generate final report
  completeInterview: async (id) => {
    const response = await API.post(`/interviews/${id}/complete`);
    return response.data;
  },

  // Get finalized report
  getInterviewReport: async (id) => {
    const response = await API.get(`/interviews/${id}/report`);
    return response.data;
  },

  // Get user interview history
  getInterviewHistory: async () => {
    const response = await API.get('/interviews');
    return response.data;
  },

  // Get user dashboard metrics & score trends
  getDashboardStats: async () => {
    const response = await API.get('/interviews/dashboard/stats');
    return response.data;
  },

  // Upload and parse resume file
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await API.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
