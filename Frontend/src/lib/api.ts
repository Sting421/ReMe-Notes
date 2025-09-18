import axios from 'axios';

const API_URL = 'http://localhost:8081/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error status code
          const message = error.response.data?.message || 'Invalid username or password';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('No response from server. Please check your connection and try again.');
        }
      }
      // Something else caused the error
      throw new Error('Login failed. Please try again later.');
    }
  },
  
  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error status code
          const message = error.response.data?.message || 'Registration failed';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('No response from server. Please check your connection and try again.');
        }
      }
      // Something else caused the error
      throw new Error('Registration failed. Please try again later.');
    }
  },
  
  // Method to check if the token is valid
  validateToken: async () => {
    try {
      const response = await api.get('/auth/validate');
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  },
  
  // Method to refresh the token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Session expired. Please login again.');
    }
  }
};

// Note interface for TypeScript type safety
export interface Note {
  id: number | string; // Support both number (from backend) and string (for routing)
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Real API for notes
export const notesAPI = {
  getNotes: async (): Promise<{ data: Note[] }> => {
    try {
      const response = await api.get('/notes');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch notes. Please try again.');
    }
  },
  
  createNote: async (note: { title: string; content: string }): Promise<{ data: Note }> => {
    try {
      const response = await api.post('/notes', note);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to create note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to create note. Please try again.');
    }
  },
  
  updateNote: async (id: string, note: { title: string; content: string }): Promise<{ data: Note }> => {
    try {
      const response = await api.put(`/notes/${id}`, note);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to update note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to update note. Please try again.');
    }
  },
  
  deleteNote: async (id: string): Promise<{ data: { success: boolean } }> => {
    try {
      await api.delete(`/notes/${id}`);
      return { data: { success: true } };
    } catch (error) {
      console.error('Error deleting note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to delete note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to delete note. Please try again.');
    }
  },
  
  getNote: async (id: string): Promise<{ data: Note }> => {
    try {
      const response = await api.get(`/notes/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch note. Please try again.');
    }
  },
  
  searchNotes: async (title: string): Promise<{ data: Note[] }> => {
    try {
      const response = await api.get(`/notes/search?title=${encodeURIComponent(title)}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error searching notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to search notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to search notes. Please try again.');
    }
  }
};