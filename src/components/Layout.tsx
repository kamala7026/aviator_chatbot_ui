// components/Layout.tsx
import React, { ReactNode, useState } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';

import DocumentManagement from './DocumentManagement';
import UsersFeedback from './UsersFeedback';
import ChatPanel from './ChatPanel';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { logout, state, setError } = useApp();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API call fails
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  // Navigation items based on user role
  const navigationItems = [
    // Documents menu - only visible for Support and Tester users
    ...(state.user?.user_type === 'Support' || state.user?.user_type === 'Tester' ? [{
      id: 'document-management', 
      label: 'Documents', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }] : []),
    // Feedback menu - visible for all users
    { 
      id: 'users-feedback', 
      label: 'Feedback', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
        </svg>
      )
    },
  ];

  const handleChatClick = () => {
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Fixed Chat Button - Top Right Corner */}
      <button
        onClick={handleChatClick}
        className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2 bg-aviator-blue text-white rounded-full hover:bg-aviator-dark transition-colors shadow-lg"
        title="Open Chat Assistant"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-medium">Chat</span>
      </button>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-aviator-blue rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aviator</h1>
              <p className="text-sm text-gray-500">Your AI Assistant</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Welcome, <strong>{state.user?.username}</strong>!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-2">
            {/* Navigation Items */}
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-aviator-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Aviator Chatbot UI v1.0
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {currentPage === 'dashboard' ? 'Dashboard' : 
               currentPage === 'document-management' ? 'Documents' :
               currentPage === 'users-feedback' ? 'Feedback' : 'Dashboard'}
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            {currentPage === 'document-management' && (state.user?.user_type === 'Support' || state.user?.user_type === 'Tester') && <DocumentManagement />}
            {currentPage === 'users-feedback' && <UsersFeedback />}
            {currentPage === 'dashboard' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Select an option from the sidebar to get started, or use the chat panel on the right.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documents card - only visible for Support and Tester users */}
                  {(state.user?.user_type === 'Support' || state.user?.user_type === 'Tester') && (
                    <div className="bg-aviator-light p-4 rounded-lg">
                      <h3 className="font-semibold text-aviator-blue mb-2">Documents</h3>
                      <p className="text-sm text-gray-600">View and manage your uploaded documents</p>
                    </div>
                  )}
                  
                  {/* Feedback card - visible for all users */}
                  <div className="bg-aviator-light p-4 rounded-lg">
                    <h3 className="font-semibold text-aviator-blue mb-2">Feedback</h3>
                    <p className="text-sm text-gray-600">View your chat feedback history</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {state.error && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center justify-between">
              <span>{state.error}</span>
              <button
                onClick={handleDismissError}
                className="ml-4 text-white hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Layout; 