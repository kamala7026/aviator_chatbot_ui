// App.tsx
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import DocumentManagement from './components/DocumentManagement';
import DocumentUpload from './components/DocumentUpload';
import UsersFeedback from './components/UsersFeedback';
import './index.css';

// Dashboard component for the main content area
const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-aviator-blue rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Aviator Chatbot</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your intelligent assistant for data management and analysis
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <div className="mb-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Assistant</h3>
                <p className="text-gray-600 text-sm">
                  Interact with your intelligent assistant for data analysis and insights.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <div className="mb-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                <p className="text-gray-600 text-sm">
                  View, edit, organize and upload your document library with advanced filtering and search.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg">
                <div className="mb-3">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback</h3>
                <p className="text-gray-600 text-sm">
                  View and analyze your chat feedback history to track your interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Show login if user is not authenticated
  if (!state.user?.isLoggedIn) {
    return <Login />;
  }

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'document-management':
        return <DocumentManagement />;
      case 'document-upload':
        return <DocumentUpload />;
      case 'users-feedback':
        return <UsersFeedback />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPageContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="App">
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default App;
