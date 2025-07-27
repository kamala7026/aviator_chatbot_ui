import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { chatApi } from '../services/api';
import Pagination from './Pagination';

interface FeedbackItem {
  id: string;
  chat_id: string;
  message_index: number;
  user_message: string;
  assistant_message: string;
  feedback_type: 'liked' | 'disliked';
  created_at: string;
}

interface FeedbackHistory {
  username: string;
  feedback_history: FeedbackItem[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

const UsersFeedback: React.FC = () => {
  const { state, setError } = useApp();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const loadFeedbackHistory = async (page: number = currentPage) => {
    if (!state.user) return;

    setLoading(true);
    try {
      const history = await chatApi.getUserFeedbackHistory(state.user.username, page, 10);
      setFeedbackHistory(history);
      setCurrentPage(page);
    } catch (error) {
      setError('Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadFeedbackHistory(page);
  };

  useEffect(() => {
    if (state.user) {
      loadFeedbackHistory(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aviator-blue"></div>
      </div>
    );
  }

  if (!feedbackHistory || feedbackHistory.feedback_history.length === 0) {
    return (
      <div>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start chatting and provide feedback to see your history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <div className="bg-aviator-light px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-aviator-blue">
            Total: {feedbackHistory.pagination.total_items} feedbacks
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {feedbackHistory.feedback_history.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.feedback_type === 'liked' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.feedback_type === 'liked' ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      Liked
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      Disliked
                    </span>
                  )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">User Query:</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      {expandedItems.has(item.id) 
                        ? item.user_message 
                        : truncateText(item.user_message, 150)
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">AI Response:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {expandedItems.has(item.id) 
                        ? item.assistant_message 
                        : truncateText(item.assistant_message, 200)
                      }
                    </p>
                  </div>
                </div>

                {(item.user_message.length > 150 || item.assistant_message.length > 200) && (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="mt-2 text-xs text-aviator-blue hover:text-aviator-dark font-medium"
                  >
                    {expandedItems.has(item.id) ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>

              <div className="ml-4 flex-shrink-0 text-xs text-gray-500">
                Chat: {item.chat_id.substring(0, 8)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {feedbackHistory && feedbackHistory.pagination.total_pages > 1 && (
        <Pagination
          currentPage={feedbackHistory.pagination.current_page}
          totalPages={feedbackHistory.pagination.total_pages}
          onPageChange={handlePageChange}
          itemsPerPage={feedbackHistory.pagination.items_per_page}
          totalItems={feedbackHistory.pagination.total_items}
        />
      )}
    </div>
  );
};

export default UsersFeedback; 