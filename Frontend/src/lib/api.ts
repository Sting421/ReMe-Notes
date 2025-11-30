import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

// Marketplace Note interface
export interface MarketplaceNote {
  id: number;
  title: string;
  description: string;
  contentPreview: string;
  fullContent?: string;
  priceAda: number;
  sellerWalletAddress: string;
  isActive: boolean;
  viewCount: number;
  purchaseCount: number;
  isPurchased: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceNoteDto {
  title: string;
  description: string;
  content: string;
  priceAda: number;
  sellerWalletAddress: string;
}

export interface PurchaseNoteDto {
  marketplaceNoteId: number;
  transactionHash: string;
  buyerWalletAddress: string;
  purchasePriceAda: number;
}

export interface NotePurchaseHistory {
  id: number;
  marketplaceNoteId?: number;
  noteTitle?: string;
  purchasePriceAda: number;
  transactionHash: string;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  purchasedAt: string;
}

// Marketplace API
export const marketplaceAPI = {
  getAllActiveNotes: async (): Promise<{ data: MarketplaceNote[] }> => {
    try {
      const response = await api.get('/marketplace/notes');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching marketplace notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch marketplace notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch marketplace notes. Please try again.');
    }
  },
  
  getNoteById: async (id: number): Promise<{ data: MarketplaceNote }> => {
    try {
      const response = await api.get(`/marketplace/notes/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching marketplace note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch marketplace note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch marketplace note. Please try again.');
    }
  },
  
  createMarketplaceNote: async (note: CreateMarketplaceNoteDto): Promise<{ data: MarketplaceNote }> => {
    try {
      const response = await api.post('/marketplace/notes', note);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating marketplace note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to create marketplace note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to create marketplace note. Please try again.');
    }
  },
  
  updateMarketplaceNote: async (id: number, note: CreateMarketplaceNoteDto): Promise<{ data: MarketplaceNote }> => {
    try {
      const response = await api.put(`/marketplace/notes/${id}`, note);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating marketplace note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to update marketplace note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to update marketplace note. Please try again.');
    }
  },
  
  deleteMarketplaceNote: async (id: number): Promise<{ data: { success: boolean } }> => {
    try {
      await api.delete(`/marketplace/notes/${id}`);
      return { data: { success: true } };
    } catch (error) {
      console.error('Error deleting marketplace note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to delete marketplace note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to delete marketplace note. Please try again.');
    }
  },
  
  searchNotes: async (query: string): Promise<{ data: MarketplaceNote[] }> => {
    try {
      const response = await api.get(`/marketplace/notes/search?query=${encodeURIComponent(query)}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error searching marketplace notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to search marketplace notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to search marketplace notes. Please try again.');
    }
  },
  
  getMyListedNotes: async (): Promise<{ data: MarketplaceNote[] }> => {
    try {
      const response = await api.get('/marketplace/notes/my-listings');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching my listed notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch my listed notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch my listed notes. Please try again.');
    }
  },
  
  getMyPurchasedNotes: async (): Promise<{ data: MarketplaceNote[] }> => {
    try {
      const response = await api.get('/marketplace/purchases/my-purchases');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching my purchased notes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch my purchased notes');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch my purchased notes. Please try again.');
    }
  },
  
  getMyPurchaseHistory: async (): Promise<{ data: NotePurchaseHistory[] }> => {
    try {
      const response = await api.get('/marketplace/purchases/history/my-buys');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch purchase history');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch purchase history. Please try again.');
    }
  },
  
  getMySalesHistory: async (): Promise<{ data: NotePurchaseHistory[] }> => {
    try {
      const response = await api.get('/marketplace/purchases/history/my-sales');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching sales history:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch sales history');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch sales history. Please try again.');
    }
  },
  
  purchaseNote: async (purchase: PurchaseNoteDto): Promise<{ data: MarketplaceNote }> => {
    try {
      const response = await api.post('/marketplace/purchase', purchase);
      return { data: response.data };
    } catch (error) {
      console.error('Error purchasing note:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to purchase note');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to purchase note. Please try again.');
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

// Transaction interface for TypeScript type safety
export interface Transaction {
  id: number;
  txHash: string;
  senderAddress: string;
  recipientAddress: string;
  amountADA: number;
  noteId?: number;
  noteTitle?: string;
  networkId?: number;
  metadata?: string;
  createdAt: string;
}

export interface CreateTransactionDto {
  txHash: string;
  senderAddress: string;
  recipientAddress: string;
  amountADA: number;
  noteId?: number;
  networkId?: number;
  metadata?: string;
}

// Transaction API
export const transactionsAPI = {
  createTransaction: async (transaction: CreateTransactionDto): Promise<{ data: Transaction }> => {
    try {
      const response = await api.post('/transactions', transaction);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating transaction:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to create transaction');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to create transaction. Please try again.');
    }
  },
  
  getUserTransactions: async (): Promise<{ data: Transaction[] }> => {
    try {
      const response = await api.get('/transactions');
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch transactions');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch transactions. Please try again.');
    }
  },
  
  getTransactionByHash: async (txHash: string): Promise<{ data: Transaction }> => {
    try {
      const response = await api.get(`/transactions/${txHash}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch transaction');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch transaction. Please try again.');
    }
  },
  
  getNoteTransactions: async (noteId: number): Promise<{ data: Transaction[] }> => {
    try {
      const response = await api.get(`/transactions/note/${noteId}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching note transactions:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to fetch note transactions');
        } else if (error.request) {
          throw new Error('No response from server. Please check your connection.');
        }
      }
      throw new Error('Failed to fetch note transactions. Please try again.');
    }
  }
};
