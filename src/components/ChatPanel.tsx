// components/ChatPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';
import { chatApi, historyApi } from '../services/api';
// import { ChatMessage } from '../types'; // Not used currently

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const {
    state,
    addMessage,
    updateMessage,
    setCurrentChat,
    setMessages,
    setChatHistory,
    setNeedsHistoryRefresh,
    updateMessageFeedback,
    // setLoading, // Not used in floating panel
    setError,
  } = useApp();

  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Drag functionality state
  const [position, setPosition] = useState<Position>({ x: window.innerWidth - 420, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const chatPanelRef = useRef<HTMLDivElement>(null);
  
  // Resize functionality state
  const [size, setSize] = useState<Position>({ x: 384, y: 500 }); // width, height
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showHistory]);

  // Initialize chat session when component mounts
  useEffect(() => {
    if (isOpen && state.user) {
      initializeChatSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, state.user]);

  const initializeChatSession = async () => {
    if (!state.user) return;

    try {
      const history = await historyApi.getUserHistory(state.user.username);
      // Update the chat history in the global state
      setChatHistory(history);
      
      // Always start with a new/empty chat after login
      setCurrentChat('new_chat');
      setMessages([]); // Clear messages for new chat
    } catch (error) {
      setError('Failed to initialize chat session');
    }
  };

  // Removed loadChatHistory as it's not used in floating panel

  const handleNewChat = () => {
    setCurrentChat('new_chat');
    setMessages([]); // Clear messages for new chat
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleHistoryItemClick = async (chatId: string) => {
    if (!state.user) return;

    setIsLoadingHistory(true);
    setShowHistory(false); // Close history when selecting a chat
    
          try {
        setCurrentChat(chatId);
        const messages = await historyApi.getChatMessages(state.user.username, chatId);
        // Update messages in global state
        setMessages(messages);
        inputRef.current?.focus();
      } catch (error) {
      setError('Failed to load chat messages');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Drag event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatPanelRef.current && !isResizing) {
      const rect = chatPanelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && chatPanelRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport bounds
      const maxX = window.innerWidth - chatPanelRef.current.offsetWidth;
      const maxY = window.innerHeight - chatPanelRef.current.offsetHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Resize event handlers
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (isResizing && chatPanelRef.current) {
      const rect = chatPanelRef.current.getBoundingClientRect();
      const minWidth = 300;
      const minHeight = 400;
      const maxWidth = window.innerWidth - position.x;
      const maxHeight = window.innerHeight - position.y;

      let newWidth = size.x;
      let newHeight = size.y;

      if (resizeDirection.includes('right')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
      }

      setSize({ x: newWidth, y: newHeight });
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    setResizeDirection('');
  };

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragOffset, isResizing, resizeDirection, size, position]);

  // Reset position when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (chatPanelRef.current) {
        const maxX = window.innerWidth - chatPanelRef.current.offsetWidth;
        const maxY = window.innerHeight - chatPanelRef.current.offsetHeight;
        
        setPosition(prev => ({
          x: Math.max(0, Math.min(prev.x, maxX)),
          y: Math.max(0, Math.min(prev.y, maxY))
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const simulateStreamingResponse = (fullResponse: string, messageIndex: number) => {
    setIsStreaming(true);
    let currentIndex = 5; // Start with first few characters immediately
    
    // Show first few characters immediately
    updateMessage(messageIndex, { role: 'assistant', content: fullResponse.substring(0, 5) });
    
    const streamingInterval = setInterval(() => {
      if (currentIndex < fullResponse.length) {
        currentIndex += 8; // Add 8 characters per interval for faster typing
        const partialResponse = fullResponse.substring(0, currentIndex);
        updateMessage(messageIndex, { role: 'assistant', content: partialResponse });
      } else {
        clearInterval(streamingInterval);
        setIsStreaming(false);
        // Ensure the complete message is shown
        updateMessage(messageIndex, { role: 'assistant', content: fullResponse });
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, 20); // Reduced from 30ms to 15ms for faster intervals
  };

    const handleSendMessage = async () => {
    if (!inputValue.trim() || !state.user) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({ role: 'user', content: userMessage });

    // Add empty assistant message for loading state
    addMessage({ role: 'assistant', content: '' });
    
    // Calculate assistant message index immediately (current length + 1 for the assistant message we just added)
    const assistantMessageIndex = state.messages.length + 1;
    
    // Show loading animation while waiting for API response
    setIsWaitingForResponse(true);

    try {
      const response = await chatApi.sendMessage({
        user_input: userMessage,
        chat_id: state.currentChatId === 'new_chat' || state.currentChatId === null ? undefined : state.currentChatId,
        username: state.user.username
      });

      // Stop loading animation when API response is received
      setIsWaitingForResponse(false);

      if (response.chat_id && state.currentChatId === 'new_chat') {
        setCurrentChat(response.chat_id);
        setNeedsHistoryRefresh(true);
      }

      // Start streaming simulation after API response
      simulateStreamingResponse(response.response, assistantMessageIndex);

    } catch (error) {
      setIsWaitingForResponse(false);
      setError('Failed to send message');
      updateMessage(assistantMessageIndex, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'liked' | 'disliked') => {
    const currentMessage = state.messages[messageIndex];
    if (!currentMessage || !state.user || !state.currentChatId || currentMessage.role !== 'assistant') return;

    const userMessage = state.messages[messageIndex - 1]?.content || '';

    // Optimistic update
    updateMessageFeedback(messageIndex, feedbackType);

    try {
      await chatApi.submitFeedback({
        username: state.user.username,
        chat_id: state.currentChatId,
        message_index: Math.floor(messageIndex / 2), // Adjust for user/assistant pairs
        user_message: userMessage,
        assistant_message: currentMessage.content,
        feedback_type: feedbackType
      });
    } catch (error) {
      // Revert on error
      updateMessageFeedback(messageIndex, null);
      setError('Failed to submit feedback');
    }
  };

  const handleCopyMessage = async (content: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Panel */}
      <div 
        ref={chatPanelRef}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          width: `${size.x}px`,
          height: `${size.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div className="flex flex-col h-full relative">
          {/* Header - Draggable */}
          <div 
            className="flex items-center justify-between px-4 py-2 border-b border-gray-200 cursor-grab select-none rounded-t-lg"
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 h-5 w-5 bg-aviator-blue rounded-full flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-aviator-blue">Aviator</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleHistory}
                className="p-1 text-gray-500 hover:text-aviator-blue transition-colors rounded"
                title="Show chat history"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded"
                title="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Chat Content */}
          <div className="flex-1 flex flex-col min-h-0">


            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 space-y-3 hide-scrollbar relative"
            >
              {/* Loading overlay for chat history */}
              {isLoadingHistory && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="loading-dots">
                      <div className="dot bg-aviator-blue"></div>
                      <div className="dot bg-aviator-blue"></div>
                      <div className="dot bg-aviator-blue"></div>
                    </div>
                    <span className="text-xs text-gray-600">Loading chat history...</span>
                  </div>
                </div>
              )}
              
              {state.messages.length === 0 && !isLoadingHistory ? (
                <div className="text-center py-4">
                  <div className="mb-2">
                    <svg className="mx-auto h-8 w-8 text-aviator-blue" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">How can I help?</h3>
                  <p className="text-gray-500 text-xs">Ask me anything about your data or system.</p>
                </div>
              ) : (
                state.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-full space-x-3">
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 h-4 w-4 bg-aviator-blue rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                          </svg>
                        </div>
                      )}
                      
                      <div className={`flex flex-col space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-2 py-1 rounded-lg max-w-none break-words text-xs ${
                            message.role === 'user'
                              ? 'bg-aviator-light text-aviator-dark border border-blue-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {/* Show loading dots for waiting assistant messages */}
                          {isWaitingForResponse && message.role === 'assistant' && !message.content && index === state.messages.length - 1 ? (
                            <div className="flex items-center">
                              <div className="loading-dots">
                                <div className="dot bg-gray-400"></div>
                                <div className="dot bg-gray-400"></div>
                                <div className="dot bg-gray-400"></div>
                              </div>
                            </div>
                          ) : (
                            /* Render message content for both user and assistant */
                                                        message.role === 'user' ? (
                              <span>{message.content}</span>
                            ) : message.role === 'assistant' && message.content ? (
                              <div className="prose prose-xs max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto my-2">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded text-xs">
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    thead: ({ children }) => (
                                      <thead className="bg-gray-50">
                                        {children}
                                      </thead>
                                    ),
                                    th: ({ children }) => (
                                      <th className="px-1 py-0.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                                        {children}
                                      </th>
                                    ),
                                    td: ({ children }) => (
                                      <td className="px-1 py-0.5 whitespace-nowrap text-xs text-gray-900 border border-gray-300">
                                        {children}
                                      </td>
                                    ),
                                    tr: ({ children }) => (
                                      <tr className="even:bg-gray-50">
                                        {children}
                                      </tr>
                                    ),
                                    code: ({ children }) => (
                                      <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                                        {children}
                                      </code>
                                    ),
                                    p: ({ children }) => (
                                      <p className="my-2 leading-relaxed">
                                        {children}
                                      </p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold">
                                        {children}
                                      </strong>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc pl-4 space-y-1">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal pl-4 space-y-1">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="text-xs">
                                        {children}
                                      </li>
                                    )
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : null
                          )}
                        </div>

                        {message.role === 'assistant' && message.content && (
                          <div className="flex items-center space-x-1">
                            {/* Like button */}
                            <button
                              onClick={() => handleFeedback(index, 'liked')}
                              className={`p-1 rounded transition-colors ${
                                message.feedback === 'liked'
                                  ? 'text-green-600 bg-green-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title="Like this response"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                            </button>

                            {/* Dislike button */}
                            <button
                              onClick={() => handleFeedback(index, 'disliked')}
                              className={`p-1 rounded transition-colors ${
                                message.feedback === 'disliked'
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Dislike this response"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
                              </svg>
                            </button>

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(message.content, index)}
                              className={`p-1 rounded transition-colors ${
                                copiedMessageIndex === index
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title={copiedMessageIndex === index ? 'Copied!' : 'Copy message'}
                            >
                              {copiedMessageIndex === index ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-xs">👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex space-x-2">
                <button
                  onClick={handleNewChat}
                  className="p-2 text-aviator-blue hover:bg-aviator-light rounded-lg transition-colors flex-shrink-0"
                  title="Start new chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isWaitingForResponse && !isStreaming && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aviator-blue focus:border-transparent text-sm"
                    disabled={isWaitingForResponse || isStreaming}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isWaitingForResponse || isStreaming}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      inputValue.trim() && !isWaitingForResponse && !isStreaming
                        ? 'bg-aviator-blue text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* History Panel - Sliding Overlay */}
          {showHistory && (
            <div className="absolute inset-0 bg-white z-20 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* History Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-aviator-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-aviator-blue">Chat History</span>
                  </div>
                  <button
                    onClick={toggleHistory}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded"
                    title="Close history"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* History Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
                  {state.chatHistory.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm">No chat history yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Start a conversation to see your history here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {state.chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleHistoryItemClick(chat.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                            state.currentChatId === chat.id
                              ? 'bg-aviator-blue text-white border-aviator-blue shadow-sm'
                              : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg className={`w-4 h-4 ${state.currentChatId === chat.id ? 'text-white' : 'text-aviator-blue'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {chat.title}
                              </div>
                              <div className={`text-xs mt-1 ${state.currentChatId === chat.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {new Date(chat.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resize Handles */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
          style={{ borderRadius: '0 0 8px 0' }}
        />
        <div 
          className="absolute bottom-0 right-2 left-2 h-1 cursor-s-resize hover:bg-gray-300 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        />
        <div 
          className="absolute top-2 bottom-2 right-0 w-1 cursor-e-resize hover:bg-gray-300 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        />
      </div>
    </>
  );
};

export default ChatPanel; 