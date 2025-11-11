'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Sparkles, MessageSquare, Image as ImageIcon, Send, Loader2, Wallet as WalletIcon, Zap, ChevronDown } from 'lucide-react';
import axios from 'axios';
import '../styles/Dashboard.css';
import '../styles/DashboardNew.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string;
  model?: string;
  cost?: number;
  isImage?: boolean;
}

interface Model {
  id: string;
  name: string;
  description: string;
  costPerMessage: number;
}

const DashboardNew = () => {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [mode, setMode] = useState('conversation');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  useEffect(() => {
    // Generate session ID on mount
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.role === 'assistant' ? msg.content : msg.content
      }));

      const response = await axios.post(`${API}/chat/send`, {
        message: userMessage.content,
        model: selectedModel,
        mode: mode,
        session_id: sessionId,
        conversation_history: history
      });

      const data = response.data;

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message || data.image_url,
        timestamp: new Date().toISOString(),
        model: data.model,
        cost: data.cost,
        isImage: !!data.image_url
      };

      setMessages((prev) => [...prev, aiMessage]);
      setTotalCost((prev) => prev + data.cost);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'error',
        content: error.response?.data?.detail || 'Failed to send message. Please check your API keys in backend .env file.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const models = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🤖' },
    { id: 'claude-3.5', name: 'Claude 3.5', provider: 'Anthropic', icon: '🧠' },
    { id: 'gemini-2.0', name: 'Gemini 2.0', provider: 'Google', icon: '✨' },
  ];

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="dashboard-new">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-content">
          <div className="logo" onClick={() => router.push('/')}>
            <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/scvvt3m1_sdfdfe.png" alt="Solana X402 GPT" className="logo-image" />
          </div>
          <div className="header-right">
            {publicKey && (
              <Badge className="wallet-badge-dash">
                <WalletIcon className="badge-icon-sm" />
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </Badge>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <div className="dash-container">
        {/* Main Chat Area */}
        <div className="dash-main">
          {/* Top Controls */}
          <div className="dash-controls">
            <div className="control-group">
              <div className="mode-switch">
                <button
                  className={`mode-btn-sm ${mode === 'conversation' ? 'active' : ''}`}
                  onClick={() => setMode('conversation')}
                >
                  <MessageSquare className="icon-sm" />
                  <span>Chat</span>
                  <span className="price-tag">0.01 USDC</span>
                </button>
                <button
                  className={`mode-btn-sm ${mode === 'image' ? 'active' : ''}`}
                  onClick={() => setMode('image')}
                >
                  <ImageIcon className="icon-sm" />
                  <span>Image</span>
                  <span className="price-tag">0.1 USDC</span>
                </button>
              </div>
            </div>

            <div className="model-selector-dropdown">
              <button 
                className="model-dropdown-btn"
                onClick={() => setShowModelSelector(!showModelSelector)}
              >
                <span className="model-icon">{currentModel?.icon}</span>
                <span className="model-name-sm">{currentModel?.name}</span>
                <ChevronDown className="chevron-icon" />
              </button>
              
              {showModelSelector && (
                <div className="model-dropdown-menu">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      className={`model-dropdown-item ${selectedModel === model.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                    >
                      <span className="model-icon">{model.icon}</span>
                      <div className="model-info-dropdown">
                        <span className="model-name">{model.name}</span>
                        <span className="model-provider">{model.provider}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="cost-display">
              <Zap className="icon-sm zap-icon" />
              <span className="cost-label">Total:</span>
              <span className="cost-value">{totalCost.toFixed(3)} USDC</span>
            </div>
          </div>

          {/* Messages Area */}
          <Card className="messages-card">
            <CardContent className="messages-wrapper">
              <div className="messages-scroll">
                {messages.length === 0 ? (
                  <div className="empty-state-new">
                    <div className="empty-icon-wrapper">
                      <Sparkles className="empty-icon-new" />
                    </div>
                    <h3 className="empty-title-new">Ready to assist you</h3>
                    <p className="empty-description-new">
                      Start a conversation with AI. Each message costs {mode === 'conversation' ? '0.01' : '0.1'} USDC.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`msg msg-${message.role}`}>
                      <div className="msg-avatar">
                        {message.role === 'user' && <WalletIcon className="avatar-icon-sm" />}
                        {message.role === 'assistant' && <Sparkles className="avatar-icon-sm" />}
                        {message.role === 'error' && <span className="error-icon">⚠️</span>}
                      </div>
                      <div className="msg-body">
                        <div className="msg-header-sm">
                          <span className="msg-sender">
                            {message.role === 'user' ? 'You' : message.role === 'error' ? 'Error' : currentModel?.name}
                          </span>
                          {message.cost && (
                            <Badge className="cost-badge-sm">{message.cost.toFixed(3)} USDC</Badge>
                          )}
                        </div>
                        <div className="msg-content-new">
                          {message.isImage ? (
                            <img src={message.content} alt="Generated" className="generated-img" />
                          ) : (
                            <p className="msg-text">{message.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="msg msg-assistant">
                    <div className="msg-avatar">
                      <Loader2 className="avatar-icon-sm spin-icon" />
                    </div>
                    <div className="msg-body">
                      <div className="msg-header-sm">
                        <span className="msg-sender">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="input-area-new">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mode === 'conversation' ? 'Type your message...' : 'Describe the image you want to generate...'}
              className="input-textarea-new"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn-new"
            >
              {isLoading ? (
                <Loader2 className="btn-icon-sm spin-icon" />
              ) : (
                <Send className="btn-icon-sm" />
              )}
              <span>{mode === 'conversation' ? 'Send' : 'Generate'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
