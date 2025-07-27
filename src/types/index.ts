// types/index.ts
export interface User {
  id: number;
  username: string;
  user_type: 'Support' | 'Client' | 'Tester';
  full_name?: string;
  email?: string;
  is_active: boolean;
  isLoggedIn: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'liked' | 'disliked' | null;
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  username: string;
}

export interface ChatRequest {
  username: string;
  chat_id?: string;
  user_input: string;
}

export interface ChatResponse {
  response: string;
  chat_id: string;
}

export interface DocumentMetadata {
  document_id: string;
  filename: string;
  description: string;
  status: string;
  access: string;
  category: string;
  total_chunks: number;
}

export interface DocumentUpload {
  file: File;
  description: string;
  category: string;
  status: string;
  access: string;
}

export interface DocumentUpdate {
  description?: string;
  status?: string;
  access?: string;
  category?: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Configuration constants
export const CATEGORIES = ["TGO", "LENS", "AO", "AIC"];
export const STATUS_OPTIONS = ["Active", "Inactive"];
export const ACCESS_OPTIONS = ["Internal", "External"];

// Login request and response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
} 