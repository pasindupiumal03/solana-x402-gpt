import { Zap, Shield, Globe, MessageSquare, Wallet, Lock } from "lucide-react";
import React from "react";

export const mockData = {
  stats: [
    { value: "50", unit: "K+", label: "Active users worldwide" },
    { value: "5", unit: "M+", label: "Messages processed daily" },
    { value: "80", unit: "+", label: "Countries supported" },
    { value: "99.9", unit: "%", label: "Uptime guarantee" },
  ],

  benefits: [
    {
      icon: React.createElement(Zap, { className: "icon" }),
      title: "Lightning-fast transactions",
      description:
        "Process payments in milliseconds with Solana blockchain technology. No waiting, no delays.",
    },
    {
      icon: React.createElement(Shield, { className: "icon" }),
      title: "Bank-grade security",
      description:
        "Your conversations and payments are secured with enterprise-level encryption and blockchain verification.",
    },
    {
      icon: React.createElement(Globe, { className: "icon" }),
      title: "Global accessibility",
      description:
        "Access AI assistance from anywhere in the world. No geographical restrictions or limitations.",
    },
    {
      icon: React.createElement(Wallet, { className: "icon" }),
      title: "No monthly fees",
      description:
        "Pay only for what you use. Connect your wallet and start chatting without subscriptions.",
    },
    {
      icon: React.createElement(MessageSquare, { className: "icon" }),
      title: "Context-aware AI",
      description:
        "Our AI remembers your conversation context for more relevant and helpful responses.",
    },
    {
      icon: React.createElement(Lock, { className: "icon" }),
      title: "Privacy-first approach",
      description:
        "Your data stays yours. We never sell or share your conversation history with third parties.",
    },
  ],

  testimonials: [
    {
      title: "Best AI chat platform I've ever used",
      text: "The combination of powerful AI and crypto payments is genius. I love that I only pay for what I use, and the Solana integration makes transactions instant. No more subscription fatigue!",
      name: "Marcus Johnson",
      role: "Tech Entrepreneur",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
    },
    {
      title: "Revolutionary payment model",
      text: "Finally, an AI service that respects my budget. The pay-per-message model with USDC is perfect for occasional users like me. The AI quality is outstanding too.",
      name: "Sarah Chen",
      role: "Product Manager @ TechCo",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    },
    {
      title: "Seamless wallet integration",
      text: "As a crypto enthusiast, I appreciate how smoothly this integrates with my Phantom wallet. The payment process is transparent and secure. Great experience overall!",
      name: "David Martinez",
      role: "Blockchain Developer",
      avatar: "https://images.unsplash.com/photo-1629425733761-caae3b5f2e50",
    },
    {
      title: "Outstanding AI responses",
      text: "The GPT integration is top-notch. I get accurate, helpful responses every time. Combined with the fair pricing model, this is now my go-to AI assistant.",
      name: "Emily Wang",
      role: "Content Creator",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    },
    {
      title: "Perfect for developers",
      text: "As a developer, I love the API access and the transparent payment structure. The Solana integration is smooth and the documentation is excellent.",
      name: "Alex Rivera",
      role: "Senior Engineer @ StartupXYZ",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
    },
    {
      title: "Game-changer for AI access",
      text: "No more worrying about monthly subscription costs. I can use the AI when I need it and only pay for those messages. Brilliant concept executed perfectly.",
      name: "Lisa Thompson",
      role: "Freelance Writer",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
    },
  ],
};
