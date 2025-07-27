// services/api.ts
import axios, { AxiosResponse } from 'axios';
import {
  ChatRequest,
  ChatResponse,
  ChatHistory,
  ChatMessage,
  DocumentMetadata,
  DocumentUpload,
  DocumentUpdate,
  LoginRequest,
  LoginResponse,
  User,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Feedback interfaces
interface FeedbackRequest {
  username: string;
  chat_id: string;
  message_index: number;
  user_message: string;
  assistant_message: string;
  feedback_type: 'liked' | 'disliked';
}

interface FeedbackResponse {
  message: string;
  feedback_id: string;
}

// Chat API Services
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response: AxiosResponse<ChatResponse> = await api.post('/chat/', request);
    return response.data;
  },

  submitFeedback: async (request: FeedbackRequest): Promise<FeedbackResponse> => {
    const response: AxiosResponse<FeedbackResponse> = await api.post('/chat/feedback', request);
    return response.data;
  },

  getUserFeedbackHistory: async (username: string, page: number = 1, limit: number = 10): Promise<{
    username: string;
    feedback_history: Array<{
      id: string;
      chat_id: string;
      message_index: number;
      user_message: string;
      assistant_message: string;
      feedback_type: 'liked' | 'disliked';
      created_at: string;
    }>;
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_previous: boolean;
    };
  }> => {
    const response = await api.get(`/chat/feedback/history/${username}?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// History API Services
export const historyApi = {
  getUserHistory: async (username: string): Promise<ChatHistory[]> => {
    const response: AxiosResponse<ChatHistory[]> = await api.get(`/history/user_history/${username}`);
    return response.data;
  },

  getChatMessages: async (username: string, chatId: string): Promise<ChatMessage[]> => {
    const response: AxiosResponse<ChatMessage[]> = await api.get(`/history/${username}/${chatId}`);
    return response.data;
  },

  createNewChat: async (username: string): Promise<{ chat_id: string }> => {
    const response: AxiosResponse<{ chat_id: string }> = await api.post(`/history/new/${username}`);
    return response.data;
  },

  updateChatTitle: async (chatId: string, newTitle: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/history/update_title', {
      chat_id: chatId,
      new_title: newTitle,
    });
    return response.data;
  },
};

// Documents API Services
export const documentsApi = {
  getAllDocuments: async (page: number = 1, limit: number = 10): Promise<{ documents: DocumentMetadata[], pagination: any }> => {
    const response = await api.get(`/documents/?page=${page}&limit=${limit}`);
    return response.data;
  },

  uploadDocument: async (upload: DocumentUpload): Promise<{ message: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('description', upload.description);
    formData.append('category', upload.category);
    formData.append('status', upload.status);
    formData.append('access', upload.access);

    const response: AxiosResponse<{ message: string; filename: string }> = await api.post(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateDocument: async (documentId: string, update: DocumentUpdate): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.patch(
      `/documents/${documentId}`,
      update
    );
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/documents/${documentId}`);
    return response.data;
  },
};

// Authentication Service (Server-side validation)
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const loginRequest: LoginRequest = { username, password };
    const response = await api.post('/auth/login', loginRequest);
    return response.data;
  },
  
  getUserInfo: async (username: string): Promise<User> => {
    const response = await api.get(`/auth/user/${username}`);
    return response.data;
  },
  
  validateSession: async (username: string, password: string): Promise<{ valid: boolean; user?: User }> => {
    const loginRequest: LoginRequest = { username, password };
    const response = await api.post('/auth/validate', loginRequest);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // No server-side logout needed for basic auth
    await new Promise(resolve => setTimeout(resolve, 200));
  },
};

export default api; 