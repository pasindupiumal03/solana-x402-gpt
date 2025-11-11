'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { Check, Zap, Shield, Globe, MessageSquare, Wallet, Sparkles, ArrowRight, Play, Star, Twitter, Send, Github, BookOpen, Copy, CheckCircle } from 'lucide-react';
import { mockData } from '../data/mock';

const Home = () => {
  const [email, setEmail] = useState('');
  const { connected } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Auto redirect to dashboard when wallet is connected
  useEffect(() => {
    if (connected) {
      router.push('/x402-chatbot');
    }
  }, [connected, router]);

  const handleGetStarted = () => {
    if (connected) {
      router.push('/x402-chatbot');
    }
  };

  const handleWatchDemo = () => {
    console.log('Watch demo clicked');
    alert('Demo video would play here.');
  };

  const handleSubscribe = () => {
    console.log('Subscribe:', email);
    alert(`Subscribed with: ${email}`);
    setEmail('');
  };

  const contractAddress = '4oBL6xZodVZAHuGgp3oGcfNkiWvtPgRkEuF1aRbdG2Kw';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing-page">
      {/* Top Info Bar */}
      <div className="info-bar">
        <div className="info-bar-content">
          <span className="info-text">
            🚀 $SOLX402 Token Launched on Solana - CA: 
            <code className="contract-address">{contractAddress}</code>
          </span>
          <button onClick={copyToClipboard} className="copy-btn" aria-label="Copy Contract Address">
            {copied ? (
              <CheckCircle className="copy-icon copied" />
            ) : (
              <Copy className="copy-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/scvvt3m1_sdfdfe.png" alt="Solana X402 GPT" className="logo-image" />
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="header-actions">
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <Badge className="hero-badge">
            <Zap className="badge-icon" />
            Powered by Solana & GPT
          </Badge>
          <h1 className="hero-title">
            Platform AI powered by <span className="gradient-text-solana">X402 Protocol</span> on <span className="gradient-text-solana">Solana</span>
          </h1>
          <p className="hero-description">
            Use All in One AI Provider for conversation and image generation from the 3 biggest AI providers GPT, Gemini, Claude with the latest pro versions now available with Pay-As-You-Go feature at 0.01 USDC per action using X402 Protocol on Solana network.
          </p>
          <div className="hero-actions">
            <WalletMultiButton className="primary-cta-wallet" />
            <Button size="lg" variant="outline" onClick={handleWatchDemo} className="secondary-cta">
              <Play className="btn-icon" />
              How it works
            </Button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card hero-card-full">
            <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/5f6ti5kt_x402.png" alt="X402 Technology" />
          </div>
        </div>
      </section>

      {/* Provider Logos Section - Marquee */}
      <section className="providers-section">
        <div className="providers-marquee-wrapper">
          <div className="providers-marquee">
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/j3i4zaoc_phantom1.png" alt="Phantom Wallet" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/9jcg7t9l_solana.png" alt="Solana" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/jdlib2yx_x402.png" alt="X402 Protocol" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/hk0dgk3j_gpt.png" alt="ChatGPT" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/2s0jroag_gemini.png" alt="Google Gemini" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/e727ltec_claude.png" alt="Claude AI" />
            </div>
            {/* Duplicate for seamless loop */}
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/j3i4zaoc_phantom1.png" alt="Phantom Wallet" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/9jcg7t9l_solana.png" alt="Solana" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/jdlib2yx_x402.png" alt="X402 Protocol" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/hk0dgk3j_gpt.png" alt="ChatGPT" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/2s0jroag_gemini.png" alt="Google Gemini" />
            </div>
            <div className="provider-logo-item">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/e727ltec_claude.png" alt="Claude AI" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <Badge className="section-badge">Features</Badge>
          <h2 className="section-title">
            Experience <span className="gradient-text">AI Pro</span> with instant crypto payments
          </h2>
          <p className="section-description">
            All your payments are processed instantly using Solana blockchain. Pay per message with USDC.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-large">
            <div className="feature-image">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/4mjl1872_ChatGPT%20Image%2030%20Okt%202025%2C%2008.56.28.png" alt="X402 Protocol" />
            </div>
            <div className="feature-content">
              <h3 className="feature-title">X402 Payment Protocol powered by Coinbase and Solana</h3>
              <p className="feature-description">
                Introducing X402 Protocol - the revolutionary HTTP 402 "Payment Required" standard for autonomous AI payments. Built on Coinbase's enterprise-grade infrastructure and Solana's high-performance blockchain, X402 enables seamless USDC micropayments with sub-second finality and ultra-low gas fees. Solana's 65,000+ TPS capacity ensures instant payment settlement, while the protocol handles authentication, verification, and confirmation in milliseconds - all transparently without user intervention.
              </p>
            </div>
          </div>

          <div className="feature-large feature-reverse">
            <div className="feature-content">
              <h3 className="feature-title">Smart AI assistance Pro</h3>
              <p className="feature-description">
                Access all premium AI Pro versions from GPT-4o, Claude 3.5 Sonnet, and Gemini 2.0 Pro - models that typically require expensive monthly subscriptions ($20-50/month per provider). Now unified in one platform with simple Pay-as-You-Go pricing. No more juggling multiple subscriptions or paying for unused capacity.
              </p>
              <ul className="feature-list">
                <li>
                  <Check className="check-icon" />
                  All latest Pro versions: GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro
                </li>
                <li>
                  <Check className="check-icon" />
                  Pay only $0.01 per message instead of $20-50/month subscriptions
                </li>
                <li>
                  <Check className="check-icon" />
                  Switch between models instantly without extra cost
                </li>
              </ul>
            </div>
            <div className="feature-image">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/riz6jloc_1724829544925.jpeg" alt="AI Chat Interface" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-header">
          <h2 className="section-title">Secure solutions for AI-powered communication</h2>
          <p className="section-description">
            With Solana X402 GPT, you get enterprise-grade AI with blockchain payment security.
          </p>
        </div>

        <div className="benefits-grid">
          {mockData.benefits.map((benefit, index) => (
            <Card key={index} className="benefit-card">
              <CardHeader>
                <div className="benefit-icon">{benefit.icon}</div>
                <CardTitle className="benefit-title">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="benefit-description">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="ticker-wrapper">
          <div className="ticker">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="ticker-item">
                <MessageSquare className="ticker-icon" />
                <span>CHAT, PAY, & ASK AI ANYTHING</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <Badge className="section-badge">Transparent Pricing</Badge>
          <h2 className="section-title">
            Simple, <span className="gradient-text">pay-per-use</span> pricing
          </h2>
          <p className="section-description">
            No subscriptions, no hidden fees. Pay only for what you generate.
          </p>
        </div>

        <div className="pricing-cards-two">
          <Card className="pricing-card-large highlight">
            <CardHeader>
              <div className="pricing-icon">
                <MessageSquare className="icon" />
              </div>
              <CardTitle className="pricing-title">AI Conversation</CardTitle>
              <div className="pricing-amount">
                <span className="price">0.01</span>
                <span className="currency">USDC</span>
              </div>
              <p className="pricing-subtitle">per message</p>
            </CardHeader>
            <CardContent>
              <ul className="pricing-features">
                <li>
                  <Check className="check-icon" />
                  GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro
                </li>
                <li>
                  <Check className="check-icon" />
                  Latest pro versions of all models
                </li>
                <li>
                  <Check className="check-icon" />
                  Context-aware conversations
                </li>
                <li>
                  <Check className="check-icon" />
                  Instant payment settlement
                </li>
                <li>
                  <Check className="check-icon" />
                  No monthly commitment
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="pricing-card-large">
            <CardHeader>
              <div className="pricing-icon image">
                <Sparkles className="icon" />
              </div>
              <CardTitle className="pricing-title">AI Generate Image</CardTitle>
              <div className="pricing-amount">
                <span className="price">0.1</span>
                <span className="currency">USDC</span>
              </div>
              <p className="pricing-subtitle">per generation</p>
            </CardHeader>
            <CardContent>
              <ul className="pricing-features">
                <li>
                  <Check className="check-icon" />
                  DALL-E 3, Imagen 3, Claude Artifacts
                </li>
                <li>
                  <Check className="check-icon" />
                  High-resolution output (1024x1024+)
                </li>
                <li>
                  <Check className="check-icon" />
                  Multiple style options
                </li>
                <li>
                  <Check className="check-icon" />
                  Commercial usage rights
                </li>
                <li>
                  <Check className="check-icon" />
                  Fast generation (15-30 seconds)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="provider-section">
          <p className="provider-label">Powered by:</p>
          <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/cnmup9a3_logo-provider-ai.png" alt="AI Providers" className="provider-logo" />
        </div>

        <div className="pricing-note">
          <p>💡 <strong>Note:</strong> All prices include ultra-low gas fees (~0.00001 SOL per transaction). X402 Protocol ensures transparent, instant payment processing on Solana blockchain.</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <Badge className="section-badge">Testimonials</Badge>
          <h2 className="section-title">Solana X402 GPT users share their experiences</h2>
          <p className="section-description">
            Join thousands of satisfied users who are experiencing the future of AI-powered conversations with blockchain payments.
          </p>
        </div>

        <Carousel className="testimonials-carousel">
          <CarouselContent>
            {mockData.testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="testimonial-item">
                <Card className="testimonial-card">
                  <CardHeader>
                    <div className="testimonial-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="star-icon filled" />
                      ))}
                    </div>
                    <CardTitle className="testimonial-title">{testimonial.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="testimonial-text">{testimonial.text}</p>
                    <div className="testimonial-author">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="author-info">
                        <p className="author-name">{testimonial.name}</p>
                        <p className="author-role">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>

      {/* Supported Models Section */}
      <section className="models-section">
        <div className="section-header">
          <h2 className="section-title">This platform supports multiple AI models</h2>
          <p className="section-description">
            Solana X402 GPT integrates with the latest and most powerful AI models, giving you access to cutting-edge artificial intelligence capabilities.
          </p>
        </div>
        <div className="models-logos">
          <div className="model-badge">GPT-4o</div>
          <div className="model-badge">Claude 3.5</div>
          <div className="model-badge">Gemini Pro</div>
          <div className="model-badge">GPT-4 Turbo</div>
        </div>
        <Button size="lg" onClick={handleGetStarted} className="models-cta">
          See all models
          <ArrowRight className="btn-icon" />
        </Button>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Connect wallet and start chatting with AI</h2>
          <p className="cta-description">
            Download your Solana wallet or use existing wallet to experience the future of AI-powered conversations with instant crypto payments.
          </p>
          <div className="cta-buttons">
            <Button size="lg" onClick={handleGetStarted} className="cta-primary">
              <Wallet className="btn-icon" />
              Connect Wallet
            </Button>
          </div>
        </div>
        <div className="cta-visual">
          <img src="https://images.pexels.com/photos/34482029/pexels-photo-34482029.jpeg" alt="Mobile App" />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <img src="https://customer-assets.emergentagent.com/job_solana-chat-ai/artifacts/scvvt3m1_sdfdfe.png" alt="Solana X402 GPT" className="logo-image" />
            </div>
            <p className="footer-description">
              The world's first AI chat platform powered by Solana blockchain payments. Pay per message, get instant AI assistance.
            </p>
            <div className="social-links">
              <a href="https://x.com/solx402gpt" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
                <Twitter className="icon" />
              </a>
              <a href="https://t.me/solx402_gpt" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Telegram">
                <Send className="icon" />
              </a>
              <a href="#" className="social-icon" aria-label="GitHub">
                <Github className="icon" />
              </a>
              <a href="#" className="social-icon" aria-label="Medium">
                <BookOpen className="icon" />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-heading">Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#models">AI Models</a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Company</h4>
              <a href="#about">About Us</a>
              <a href="#careers">Careers</a>
              <a href="#blog">Blog</a>
              <a href="#press">Press</a>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="#docs">Documentation</a>
              <a href="#status">Status</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright">© 2025 Solana X402 GPT. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;