// context/AppContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, ChatMessage, ChatHistory } from '../types';

// State interface
interface AppState {
  user: User | null;
  currentChatId: string | null;
  messages: ChatMessage[];
  chatHistory: ChatHistory[];
  isLoading: boolean;
  error: string | null;
  needsHistoryRefresh: boolean;
}

// Action types
type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_CHAT'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { index: number; message: ChatMessage } }
  | { type: 'SET_CHAT_HISTORY'; payload: ChatHistory[] }
  | { type: 'SET_NEEDS_HISTORY_REFRESH'; payload: boolean }
  | { type: 'UPDATE_MESSAGE_FEEDBACK'; payload: { index: number; feedback: 'liked' | 'disliked' | null } };

// Initial state
const initialState: AppState = {
  user: null,
  currentChatId: null,
  messages: [],
  chatHistory: [],
  isLoading: false,
  error: null,
  needsHistoryRefresh: false,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChatId: action.payload,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'ADD_MESSAGE':
      console.log('ADD_MESSAGE action:', action.payload);
      console.log('Current messages before add:', state.messages);
      const newMessages = [...state.messages, action.payload];
      console.log('New messages after add:', newMessages);
      return {
        ...state,
        messages: newMessages,
      };
    case 'UPDATE_MESSAGE':
      console.log(`UPDATE_MESSAGE reducer: updating index ${action.payload.index}`);
      console.log(`Messages array before update:`, state.messages);
      const updatedMessages = state.messages.map((msg, index) =>
        index === action.payload.index ? action.payload.message : msg
      );
      console.log(`Messages array after update:`, updatedMessages);
      return {
        ...state,
        messages: updatedMessages,
      };
    case 'SET_CHAT_HISTORY':
      return {
        ...state,
        chatHistory: action.payload,
      };
    case 'SET_NEEDS_HISTORY_REFRESH':
      return {
        ...state,
        needsHistoryRefresh: action.payload,
      };
    case 'UPDATE_MESSAGE_FEEDBACK':
      return {
        ...state,
        messages: state.messages.map((msg, index) =>
          index === action.payload.index
            ? { ...msg, feedback: action.payload.feedback }
            : msg
        ),
      };
    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentChat: (chatId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (index: number, message: ChatMessage) => void;
  setChatHistory: (history: ChatHistory[]) => void;
  setNeedsHistoryRefresh: (needs: boolean) => void;
  updateMessageFeedback: (index: number, feedback: 'liked' | 'disliked' | null) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const login = (user: User) => dispatch({ type: 'LOGIN', payload: user });
  const logout = () => dispatch({ type: 'LOGOUT' });
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setError = (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error });
  const setCurrentChat = (chatId: string | null) => dispatch({ type: 'SET_CURRENT_CHAT', payload: chatId });
  const setMessages = (messages: ChatMessage[]) => dispatch({ type: 'SET_MESSAGES', payload: messages });
  const addMessage = (message: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: message });
  const updateMessage = (index: number, message: ChatMessage) => {
    console.log(`UPDATE_MESSAGE: index=${index}, message=`, message);
    console.log(`Current messages array length: ${state.messages.length}`);
    dispatch({ type: 'UPDATE_MESSAGE', payload: { index, message } });
  };
  const setChatHistory = (history: ChatHistory[]) => dispatch({ type: 'SET_CHAT_HISTORY', payload: history });
  const setNeedsHistoryRefresh = (needs: boolean) => dispatch({ type: 'SET_NEEDS_HISTORY_REFRESH', payload: needs });
  const updateMessageFeedback = (index: number, feedback: 'liked' | 'disliked' | null) =>
    dispatch({ type: 'UPDATE_MESSAGE_FEEDBACK', payload: { index, feedback } });

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    setLoading,
    setError,
    setCurrentChat,
    setMessages,
    addMessage,
    updateMessage,
    setChatHistory,
    setNeedsHistoryRefresh,
    updateMessageFeedback,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 