'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Sparkles, MessageSquare, Image as ImageIcon, Send, Loader2, Wallet as WalletIcon, Zap, ChevronDown, AlertCircle, DollarSign } from 'lucide-react';
import axios from 'axios';
import { paymentService } from '../../lib/usdcPayment';
import '../styles/Dashboard.css';
import '../styles/DashboardNew.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'error' | 'payment';
  content: string;
  timestamp: string;
  model?: string;
  cost?: number;
  isImage?: boolean;
  paymentSignature?: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
  costPerMessage: number;
}

interface PaymentState {
  isProcessing: boolean;
  signature?: string;
  error?: string;
}

const DashboardNew = () => {
  const { publicKey, connected, sendTransaction, wallet } = useWallet();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('x402-crypto-agent');
  const [mode, setMode] = useState('conversation');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>({ isProcessing: false });
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check USDC balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkUSDCBalance();
    }
  }, [connected, publicKey]);

  const checkUSDCBalance = async () => {
    if (!publicKey) return;
    
    setBalanceLoading(true);
    try {
      const balance = await paymentService.getUserUSDCBalance(publicKey);
      setUsdcBalance(balance);
      console.log('USDC Balance:', balance);
    } catch (error) {
      console.error('Error checking USDC balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const processPayment = async (): Promise<string | null> => {
    if (!publicKey || !sendTransaction || !wallet?.adapter) {
      throw new Error('Wallet not connected');
    }

    setPaymentState({ isProcessing: true });

    try {
      console.log('Creating payment transaction...');
      
      // Create payment transaction
      const paymentResult = await paymentService.createPaymentTransaction({
        userPublicKey: publicKey,
        amount: 0.00001,
        memo: 'X402 Chat Payment'
      });

      if (!paymentResult.success || !paymentResult.transaction) {
        throw new Error(paymentResult.error || 'Failed to create payment transaction');
      }

      console.log('Payment transaction created, requesting signature...');

      // Send transaction through wallet
      const signature = await sendTransaction(paymentResult.transaction, paymentService['connection']);

      console.log('Transaction sent with signature:', signature);

      // Add small delay to ensure transaction propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPaymentState({ isProcessing: false, signature });
      
      // Update balance after payment
      setTimeout(() => {
        checkUSDCBalance();
      }, 2000);

      return signature;
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentState({ 
        isProcessing: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      });
      throw error;
    }
  };

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
    if (!inputMessage.trim() || isLoading || !publicKey) return;

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
      // Process payment first
      console.log('Processing X402 payment...');
      
      const paymentSignature = await processPayment();
      
      if (!paymentSignature) {
        throw new Error('Payment processing failed');
      }

      console.log('Payment successful, sending message to X402 API...');

      // Prepare conversation history
      const history = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Send to X402 API
      const response = await axios.post('/api/x402-chatbot', {
        message: userMessage.content,
        conversationHistory: history,
        walletAddress: publicKey.toString(),
        paymentSignature: paymentSignature
      });

      const data = response.data;

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        model: 'X402 Crypto Agent',
        cost: data.cost || 0.00001,
        paymentSignature: paymentSignature
      };

      setMessages((prev) => [...prev, aiMessage]);
      setTotalCost((prev) => prev + (data.cost || 0.00001));
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorContent = 'Failed to send message. ';
      
      if (error.response?.status === 402) {
        errorContent = '💰 Payment required: 0.00001 USDC per message. Please ensure you have sufficient USDC balance in your wallet.';
      } else if (error.message?.includes('Payment')) {
        errorContent = error.message + ' Please ensure you have sufficient USDC in your wallet.';
      } else {
        errorContent += error.response?.data?.error || error.message || 'Please try again.';
      }
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'error',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setPaymentState({ isProcessing: false });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const models = [
    { id: 'x402-crypto-agent', name: 'X402 Crypto Agent', provider: 'Premium AI', icon: '🚀' },
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
              <div className="wallet-info-group">
                <Badge className="wallet-badge-dash">
                  <WalletIcon className="badge-icon-sm" />
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </Badge>
                <Badge className="balance-badge">
                  <DollarSign className="badge-icon-sm" />
                  {balanceLoading ? 'Loading...' : `${usdcBalance.toFixed(6)} USDC`}
                </Badge>
              </div>
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
                  className={`mode-btn-sm active`}
                  disabled
                >
                  <MessageSquare className="icon-sm" />
                  <span>X402 Chat</span>
                  <span className="price-tag">0.00001 USDC</span>
                </button>
              </div>
            </div>

            <div className="model-selector-dropdown">
              <button 
                className="model-dropdown-btn"
                disabled
              >
                <span className="model-icon">{currentModel?.icon}</span>
                <span className="model-name-sm">{currentModel?.name}</span>
              </button>
            </div>

            <div className="cost-display">
              <Zap className="icon-sm zap-icon" />
              <span className="cost-label">Session:</span>
              <span className="cost-value">{totalCost.toFixed(6)} USDC</span>
            </div>

            {paymentState.isProcessing && (
              <div className="payment-status processing">
                <Loader2 className="icon-sm spin-icon" />
                <span>Processing Payment...</span>
              </div>
            )}

            {usdcBalance < 0.00001 && !balanceLoading && (
              <div className="payment-status insufficient">
                <AlertCircle className="icon-sm" />
                <span>Insufficient USDC Balance</span>
              </div>
            )}
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
                    <h3 className="empty-title-new">X402 Crypto Agent Ready</h3>
                    <p className="empty-description-new">
                      Premium cryptocurrency AI assistant. Each message costs 0.00001 USDC.
                    </p>
                    <div className="empty-features">
                      <div className="feature-item">🚀 Real-time crypto analysis</div>
                      <div className="feature-item">💹 Trading strategies</div>
                      <div className="feature-item">🔗 DeFi & blockchain expertise</div>
                    </div>
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
                            {message.role === 'user' ? 'You' : 
                             message.role === 'error' ? 'Error' : 
                             message.role === 'payment' ? 'Payment' : 'X402 Agent'}
                          </span>
                          {message.cost && (
                            <Badge className="cost-badge-sm">
                              {message.cost.toFixed(6)} USDC
                            </Badge>
                          )}
                          {message.paymentSignature && (
                            <Badge className="payment-badge-sm">
                              ✅ Paid
                            </Badge>
                          )}
                        </div>
                        <div className="msg-content-new">
                          {message.isImage ? (
                            <img src={message.content} alt="Generated" className="generated-img" />
                          ) : (
                            <div>
                              {/* Show timestamp for assistant messages */}
                              {message.role === 'assistant' && (
                                <div className="msg-timestamp">
                                  {new Date(message.timestamp).toLocaleString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZoneName: 'short'
                                  })}
                                </div>
                              )}
                              <div className="msg-text formatted-content">
                                {message.content.split('\n').map((line, index) => (
                                  <React.Fragment key={index}>
                                    {line}
                                    {index < message.content.split('\n').length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </div>
                              {/* Show transaction hash for assistant messages */}
                              {message.role === 'assistant' && message.paymentSignature && (
                                <div className="msg-tx-hash">
                                  <span className="tx-label">Tx: </span>
                                  <code className="tx-hash">
                                    {message.paymentSignature.slice(0, 8)}...{message.paymentSignature.slice(-8)}
                                  </code>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {(isLoading || paymentState.isProcessing) && (
                  <div className="msg msg-assistant">
                    <div className="msg-avatar">
                      <Loader2 className="avatar-icon-sm spin-icon" />
                    </div>
                    <div className="msg-body">
                      <div className="msg-header-sm">
                        <span className="msg-sender">
                          {paymentState.isProcessing ? 'Processing Payment...' : 'X402 Agent thinking...'}
                        </span>
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
              placeholder="Ask me about cryptocurrency, trading, DeFi, or blockchain development..."
              className="input-textarea-new"
              rows={2}
              disabled={isLoading || paymentState.isProcessing || !connected}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || paymentState.isProcessing || !connected}
              className="send-btn-new"
            >
              {(isLoading || paymentState.isProcessing) ? (
                <Loader2 className="btn-icon-sm spin-icon" />
              ) : (
                <Send className="btn-icon-sm" />
              )}
              <span>
                {paymentState.isProcessing ? 'Paying...' : 
                 isLoading ? 'Sending...' : 'Send (0.00001 USDC)'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNew;
