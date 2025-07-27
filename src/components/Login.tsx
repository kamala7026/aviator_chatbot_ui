// components/Login.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';

const Login: React.FC = () => {
  const { login, setLoading, setError, state } = useApp();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials.username, credentials.password);
      
      if (response.success && response.user) {
        login({
          ...response.user,
          isLoggedIn: true,
        });
      } else {
        setError(response.message || 'Invalid username or password');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Invalid username or password');
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviator-light to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-aviator-blue rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Aviator Chat
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please log in to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {state.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {state.error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-aviator-blue focus:border-aviator-blue"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={state.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-aviator-blue hover:bg-aviator-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aviator-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {state.isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-dots mr-2">
                      <div className="dot bg-white"></div>
                      <div className="dot bg-white"></div>
                      <div className="dot bg-white"></div>
                    </div>
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>testuser</strong> / password123</div>
              <div><strong>user2</strong> / abc</div>
              <div><strong>kamala</strong> / admin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 