// components/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';
import { chatApi, historyApi } from '../services/api';
import { ChatMessage } from '../types';

const Chat: React.FC = () => {
  const {
    state,
    setMessages,
    addMessage,
    updateMessage,
    setChatHistory,
    setCurrentChat,
    setNeedsHistoryRefresh,
    updateMessageFeedback,
    setLoading,
    setError,
  } = useApp();

  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Initialize chat on component mount
  useEffect(() => {
    if (state.user && state.chatHistory.length === 0 && !state.currentChatId) {
      initializeChatSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user]);

  // Refresh history when needed
  useEffect(() => {
    if (state.needsHistoryRefresh && state.user) {
      loadChatHistory();
      setNeedsHistoryRefresh(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.needsHistoryRefresh, state.user]);

  const initializeChatSession = async () => {
    if (!state.user) return;

    setLoading(true);
    try {
      const history = await historyApi.getUserHistory(state.user.username);
      setChatHistory(history);

      if (history.length > 0) {
        // Load the most recent chat
        const recentChat = history[0];
        setCurrentChat(recentChat.id);
        const messages = await historyApi.getChatMessages(state.user.username, recentChat.id);
        setMessages(messages);
      } else {
        // Start with a new chat
        setCurrentChat('new_chat');
        setMessages([]);
      }
    } catch (error) {
      setError('Failed to initialize chat session');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!state.user) return;

    try {
      const history = await historyApi.getUserHistory(state.user.username);
      setChatHistory(history);
    } catch (error) {
      setError('Failed to load chat history');
    }
  };

  const handleNewChat = () => {
    setCurrentChat('new_chat');
    setMessages([]);
  };

  const handleHistoryItemClick = async (chatId: string) => {
    if (!state.user) return;

    setIsLoadingHistory(true);
    try {
      setCurrentChat(chatId);
      const messages = await historyApi.getChatMessages(state.user.username, chatId);
      
      // Debug: Log the received messages to check if feedback is included
      console.log('Received messages from API:', messages);
      messages.forEach((msg, index) => {
        console.log(`Message ${index}: role=${msg.role}, feedback=${msg.feedback}, content=${msg.content?.substring(0, 50)}...`);
      });
      
      setMessages(messages);
    } catch (error) {
      setError('Failed to load chat messages');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const simulateStreamingResponse = async (fullResponse: string, messageIndex: number): Promise<string> => {
    return new Promise((resolve) => {
      const words = fullResponse.split(' ');
      let currentResponse = '';
      let wordIndex = 0;

      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          currentResponse += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
          
          // Update the specific message with the current response
          updateMessage(messageIndex, {
            role: 'assistant',
            content: currentResponse,
          });
          
          wordIndex++;
        } else {
          clearInterval(interval);
          setIsStreaming(false);
          resolve(currentResponse);
        }
      }, 80); // Adjust speed as needed (80ms for better readability)
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !state.user || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    // Calculate the assistant message index before adding messages
    const assistantMessageIndex = state.messages.length + 1; // Will be the index after adding user and assistant messages

    // Add user message
    addMessage(userMessage);
    
    // Add placeholder for assistant response
    const placeholderMessage: ChatMessage = {
      role: 'assistant',
      content: '',
    };
    addMessage(placeholderMessage);

    setInputValue('');
    setIsStreaming(true);

    try {
      const response = await chatApi.sendMessage({
        username: state.user.username,
        chat_id: state.currentChatId === 'new_chat' || state.currentChatId === null ? undefined : state.currentChatId,
        user_input: userMessage.content,
      });

      // If this was a new chat, update the current chat ID
      if (state.currentChatId === 'new_chat' || state.currentChatId === null) {
        setCurrentChat(response.chat_id);
        setNeedsHistoryRefresh(true);
      }

      // Simulate streaming response with correct message index
      await simulateStreamingResponse(response.response, assistantMessageIndex);

    } catch (error) {
      setError('Failed to send message');
      setIsStreaming(false);
      // Remove the placeholder message on error
      setMessages(state.messages.slice(0, -1));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageIndex: number, feedback: 'liked' | 'disliked') => {
    const currentMessage = state.messages[messageIndex];
    const newFeedback = currentMessage.feedback === feedback ? null : feedback;
    updateMessageFeedback(messageIndex, newFeedback);
  };

  return (
    <div className="flex h-full max-h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 relative"
          style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '400px' }}
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
                <span className="text-sm text-gray-600">Loading chat history...</span>
              </div>
            </div>
          )}
          
          {state.messages.length === 0 && !isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-aviator-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
                <h3 className="text-xl font-medium mb-2">Welcome to Aviator Chat</h3>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            state.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex max-w-3xl space-x-3">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 bg-aviator-blue rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                    </div>
                  )}
                  
                  <div className={`flex flex-col space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2 rounded-lg max-w-none break-words ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content ? (
                        message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-4">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
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
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                                    {children}
                                  </td>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-gray-50">
                                    {children}
                                  </tr>
                                ),
                                code: ({ children, ...props }: any) => (
                                  (props.inline) ? (
                                    <code className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                                      <code className="text-sm font-mono text-gray-800">
                                        {children}
                                      </code>
                                    </pre>
                                  )
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-gray-900">
                                    {children}
                                  </strong>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-sm">
                                    {children}
                                  </li>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )
                      ) : isStreaming && message.role === 'assistant' ? (
                        <div className="flex items-center space-x-2">
                          <div className="loading-dots">
                            <div className="dot bg-gray-500"></div>
                            <div className="dot bg-gray-500"></div>
                            <div className="dot bg-gray-500"></div>
                          </div>
                          
                        </div>
                      ) : (
                        <div className="loading-dots">
                          <div className="dot bg-gray-500"></div>
                          <div className="dot bg-gray-500"></div>
                          <div className="dot bg-gray-500"></div>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'assistant' && message.content && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleFeedback(index, 'liked')}
                          className={`p-1 rounded text-sm transition-colors ${
                            message.feedback === 'liked'
                              ? 'bg-green-100 text-green-600'
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'disliked')}
                          className={`p-1 rounded text-sm transition-colors ${
                            message.feedback === 'disliked'
                              ? 'bg-red-100 text-red-600'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211 1.412.608 2.006L17 13V4m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm">👤</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me something..."
              disabled={isStreaming}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aviator-blue focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="px-6 py-3 bg-aviator-blue text-white rounded-lg hover:bg-aviator-dark focus:outline-none focus:ring-2 focus:ring-aviator-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isStreaming ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-dots">
                    <div className="dot bg-white"></div>
                    <div className="dot bg-white"></div>
                    <div className="dot bg-white"></div>
                  </div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Chat History</h3>
            <button
              onClick={handleNewChat}
              className="flex items-center space-x-2 px-3 py-2 bg-aviator-blue text-white rounded-lg hover:bg-aviator-dark transition-colors text-sm font-medium"
              title="Start new chat"
            >
              <span>➕</span>
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {state.chatHistory.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No chat history yet.</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {state.chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleHistoryItemClick(chat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    state.currentChatId === chat.id
                      ? 'bg-aviator-blue text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    📜 {chat.title}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(chat.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat; 