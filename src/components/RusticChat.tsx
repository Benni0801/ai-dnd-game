'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface RusticChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onRetryRequest?: () => void;
  lastFailedRequest?: any;
}

export default function RusticChat({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onRetryRequest,
  lastFailedRequest 
}: RusticChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content: string) => {
    // Simple formatting for dice rolls and emphasis
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-dnd-gold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-yellow-300">$1</em>')
      .replace(/\[DICE_ROLL:([^\]]+)\]/g, '<span class="bg-dnd-gold text-dnd-darker px-2 py-1 rounded text-sm font-bold">🎲 $1</span>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="fantasy-card mb-4">
        <div className="flex items-center justify-between">
          <h2 className="rustic-title text-xl">🗣️ Adventure Chat</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">AI Ready</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rustic-scrollbar mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="fantasy-card">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="rustic-subtitle text-lg mb-2">Welcome, Adventurer!</h3>
              <p className="rustic-text text-sm">
                Your epic journey begins here. Tell the AI Dungeon Master what you'd like to do, 
                and let the adventure unfold!
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Try saying:</p>
                <p>• "I want to explore the forest"</p>
                <p>• "Roll for initiative"</p>
                <p>• "Show me my character sheet"</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-card ${message.role} fade-in-up`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      👤
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-dnd-gold rounded-full flex items-center justify-center text-dnd-darker font-bold">
                      🧙
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-dnd-gold">
                      {message.role === 'user' ? 'You' : 'Dungeon Master'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.isError && (
                      <span className="text-xs text-red-400">⚠️ Error</span>
                    )}
                  </div>
                  <div 
                    className="rustic-text text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                  />
                  {message.isError && onRetryRequest && (
                    <button
                      onClick={onRetryRequest}
                      className="mt-2 rustic-button text-xs"
                    >
                      🔄 Retry Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="message-card ai fade-in-up">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-dnd-gold rounded-full flex items-center justify-center text-dnd-darker font-bold">
                🧙
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-bold text-dnd-gold">Dungeon Master</span>
                  <span className="text-xs text-gray-400">thinking...</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-dnd-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-400 ml-2">The AI is crafting your adventure...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fantasy-card">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to do, adventurer?"
              className="flex-1 rustic-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="rustic-button px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
          
          {/* Retry Button */}
          {lastFailedRequest && (
            <div className="flex justify-center">
              <button
                onClick={onRetryRequest}
                className="rustic-button text-sm bg-red-600 hover:bg-red-700"
              >
                🔄 Retry Last Request
              </button>
            </div>
          )}

          <div className="text-xs text-gray-400 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}



