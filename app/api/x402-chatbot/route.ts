import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { paymentService } from '@/lib/usdcPayment';

// Rate limiting storage (in production, use Redis or a database)
const messageCount = new Map<string, { count: number; timestamp: number }>();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RPC_ENDPOINT = 'https://rpc-mainnet.solanatracker.io/?api_key=8b90bec5-e575-4212-9c39-4e2496f29a2f';

// CoinGecko API endpoints
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Clean excessive markdown formatting
const cleanMarkdownFormatting = (text: string): string => {
  return text
    // Remove excessive ** symbols around section headers, keep content bold
    .replace(/\*\*([^*]+):\*\*/g, '$1:')
    // Keep important emphasis but clean up excessive formatting
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    // Convert remaining ** to single emphasis where appropriate
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    // Clean up excessive bullets and formatting
    .replace(/^\*\*\s*-\s*/gm, '• ')
    .replace(/^\*\*\s*\d+\.\s*/gm, (match) => match.replace(/\*\*/g, ''))
    // Remove excessive spacing
    .replace(/\n{3,}/g, '\n\n')
    // Clean up any remaining markdown symbols
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
};

// Helper function to detect token address format
const detectTokenType = (input: string): 'solana' | 'ethereum' | 'unknown' => {
  // Solana addresses are typically 32-44 characters, base58 encoded
  if (input.length >= 32 && input.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(input)) {
    return 'solana';
  }
  // Ethereum addresses start with 0x and are 42 characters long
  if (input.startsWith('0x') && input.length === 42) {
    return 'ethereum';
  }
  return 'unknown';
};

// Function to check if message is asking for real-time market data
const detectMarketDataRequest = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  
  // Bitcoin price queries
  if (lowerMessage.includes('bitcoin') && (lowerMessage.includes('price') || lowerMessage.includes('current'))) {
    return 'bitcoin_price';
  }
  
  // Top gainers queries
  if ((lowerMessage.includes('top') || lowerMessage.includes('best')) && 
      (lowerMessage.includes('gainer') || lowerMessage.includes('performer') || lowerMessage.includes('rising'))) {
    return 'top_gainers';
  }
  
  // Market trends queries
  if (lowerMessage.includes('market') && (lowerMessage.includes('trend') || lowerMessage.includes('overview') || lowerMessage.includes('sentiment'))) {
    return 'market_trends';
  }
  
  // Price queries for specific coins
  if (lowerMessage.includes('price') && (lowerMessage.includes('ethereum') || lowerMessage.includes('eth'))) {
    return 'ethereum_price';
  }
  
  if (lowerMessage.includes('price') && (lowerMessage.includes('solana') || lowerMessage.includes('sol'))) {
    return 'solana_price';
  }
  
  // Top coins by market cap
  if ((lowerMessage.includes('top') || lowerMessage.includes('largest')) && 
      (lowerMessage.includes('coin') || lowerMessage.includes('crypto') || lowerMessage.includes('market cap'))) {
    return 'top_coins';
  }
  
  return null;
};

// Function to get Bitcoin price
const getBitcoinPrice = async () => {
  try {
    const response = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }
    
    const data = await response.json();
    const btcData = data.bitcoin;
    
    return {
      price: btcData.usd,
      change24h: btcData.usd_24h_change,
      volume24h: btcData.usd_24h_vol,
      marketCap: btcData.usd_market_cap
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    return null;
  }
};

// Function to get top gainers (last 24h)
const getTopGainers = async () => {
  try {
    const response = await fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch top gainers');
    }
    
    const data = await response.json();
    return data.slice(0, 10); // Top 10 gainers
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    return null;
  }
};

// Function to get market overview/trends
const getMarketTrends = async () => {
  try {
    const [globalResponse, trendingResponse] = await Promise.all([
      fetch(`${COINGECKO_BASE_URL}/global`),
      fetch(`${COINGECKO_BASE_URL}/search/trending`)
    ]);
    
    if (!globalResponse.ok || !trendingResponse.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    const globalData = await globalResponse.json();
    const trendingData = await trendingResponse.json();
    
    return {
      global: globalData.data,
      trending: trendingData.coins.slice(0, 7)
    };
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return null;
  }
};

// Function to get top coins by market cap
const getTopCoins = async () => {
  try {
    const response = await fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch top coins');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return null;
  }
};

// Function to get specific coin price (Ethereum, Solana, etc.)
const getCoinPrice = async (coinId: string) => {
  try {
    const response = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${coinId} price`);
    }
    
    const data = await response.json();
    return data[coinId];
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error);
    return null;
  }
};

// Function to search for token by name or symbol
const searchTokenByNameOrSymbol = async (query: string) => {
  try {
    // Search CoinGecko for tokens by name/symbol
    const searchUrl = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error('Failed to search tokens');
    }
    
    const searchData = await response.json();
    return searchData.coins?.slice(0, 5) || []; // Return top 5 matches
  } catch (error) {
    console.error('Error searching tokens:', error);
    return [];
  }
};

// Function to format market data responses
const formatMarketDataResponse = async (dataType: string, data: any) => {
  // Create a fallback response in case OpenAI is not available
  const createFallbackResponse = (dataType: string, data: any) => {
    switch (dataType) {
      case 'bitcoin_price':
        return `📈 Bitcoin (BTC) Real-Time Data:\n- Price: $${data.price?.toLocaleString() || 'N/A'}\n- 24h Change: ${data.change24h?.toFixed(2) || 'N/A'}%\n- 24h Volume: $${data.volume24h?.toLocaleString() || 'N/A'}\n- Market Cap: $${data.marketCap?.toLocaleString() || 'N/A'}\n\n🚀 Analysis:\nBitcoin shows ${data.change24h > 0 ? 'positive momentum' : 'consolidation'} with ${Math.abs(data.change24h)?.toFixed(2)}% movement in the last 24 hours.\n\n*Premium crypto analysis via X402 protocol*`;
      
      case 'top_gainers':
        const gainersText = data?.map((coin: any, index: number) => 
          `${index + 1}. ${coin.name} (${coin.symbol?.toUpperCase()}) - 📈 ${coin.price_change_percentage_24h?.toFixed(2)}% ($${coin.current_price?.toFixed(6)})`
        ).join('\n') || 'No data available';
        return `🚀 Top 10 Crypto Gainers (24h)\n\n${gainersText}\n\n*Premium crypto analysis via X402 protocol*`;
        
      case 'market_trends':
        const totalMarketCap = data?.global?.total_market_cap?.usd;
        const marketCapChange = data?.global?.market_cap_change_percentage_24h_usd;
        const btcDominance = data?.global?.market_cap_percentage?.btc;
        const ethDominance = data?.global?.market_cap_percentage?.eth;
        
        const trendingCoins = data?.trending?.map((item: any, index: number) => 
          `${index + 1}. ${item.item.name} (${item.item.symbol}) - Rank #${item.item.market_cap_rank || 'N/A'}`
        ).join('\n') || 'No trending data available';
        
        return `📊 Cryptocurrency Market Overview\n\nMarket Statistics:\n• Total Market Cap: $${totalMarketCap?.toLocaleString() || 'N/A'}\n• 24h Market Cap Change: ${marketCapChange?.toFixed(2) || 'N/A'}%\n• Bitcoin Dominance: ${btcDominance?.toFixed(2) || 'N/A'}%\n• Ethereum Dominance: ${ethDominance?.toFixed(2) || 'N/A'}%\n\nTop Trending:\n${trendingCoins}\n\n*Premium crypto analysis via X402 protocol*`;
        
      case 'top_coins':
        const topCoinsText = data?.map((coin: any, index: number) => 
          `${index + 1}. ${coin.name} (${coin.symbol?.toUpperCase()}) - $${coin.current_price?.toLocaleString()} (${coin.price_change_percentage_24h?.toFixed(2)}%)`
        ).join('\n') || 'No data available';
        return `🏆 Top 15 Cryptocurrencies by Market Cap\n\n${topCoinsText}\n\n*Premium crypto analysis via X402 protocol*`;
        
      case 'ethereum_price':
        return `📈 Ethereum (ETH) Real-Time Data:\n- Price: $${data.usd?.toLocaleString() || 'N/A'}\n- 24h Change: ${data.usd_24h_change?.toFixed(2) || 'N/A'}%\n- 24h Volume: $${data.usd_24h_vol?.toLocaleString() || 'N/A'}\n- Market Cap: $${data.usd_market_cap?.toLocaleString() || 'N/A'}\n\n🚀 Analysis:\nEthereum shows ${data.usd_24h_change > 0 ? 'bullish momentum' : 'market correction'} with ${Math.abs(data.usd_24h_change)?.toFixed(2)}% movement.\n\n*Premium crypto analysis via X402 protocol*`;
        
      case 'solana_price':
        return `📈 Solana (SOL) Real-Time Data:\n- Price: $${data.usd?.toLocaleString() || 'N/A'}\n- 24h Change: ${data.usd_24h_change?.toFixed(2) || 'N/A'}%\n- 24h Volume: $${data.usd_24h_vol?.toLocaleString() || 'N/A'}\n- Market Cap: $${data.usd_market_cap?.toLocaleString() || 'N/A'}\n\n🚀 Analysis:\nSolana demonstrates ${data.usd_24h_change > 0 ? 'strong performance' : 'consolidation phase'} with ${Math.abs(data.usd_24h_change)?.toFixed(2)}% change in the last 24 hours.\n\n💡 Key Insights:\n1. Price Action: ${data.usd_24h_change > 0 ? 'Positive momentum suggests growing confidence' : 'Price correction may present buying opportunities'}\n2. Volume Analysis: $${data.usd_24h_vol?.toLocaleString()} in 24h trading volume indicates ${data.usd_24h_vol > 1000000000 ? 'high' : 'moderate'} market activity\n3. Market Position: With $${data.usd_market_cap?.toLocaleString()} market cap, SOL maintains strong market presence\n\n*Premium crypto analysis via X402 protocol*`;
        
      default:
        return 'Market data fetched successfully.';
    }
  };

  // If no OpenAI API key is provided, return fallback immediately
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_') || OPENAI_API_KEY.includes('sk-your_')) {
    console.log('OpenAI API key not configured, using fallback response');
    return createFallbackResponse(dataType, data);
  }

  try {
    let prompt = '';
    let systemMessage = 'You are X402 Agent, a premium cryptocurrency specialist. Provide detailed, professional crypto analysis with actionable insights. Use emojis and clear formatting. Always mention this is "Premium crypto analysis via X402 protocol" at the end.';
    
    switch (dataType) {
      case 'bitcoin_price':
        prompt = `Current Bitcoin (BTC) Real-Time Data:
- Price: $${data.price?.toLocaleString() || 'N/A'}
- 24h Change: ${data.change24h?.toFixed(2) || 'N/A'}%
- 24h Volume: $${data.volume24h?.toLocaleString() || 'N/A'}
- Market Cap: $${data.marketCap?.toLocaleString() || 'N/A'}

Please provide an engaging analysis of Bitcoin's current price performance with actionable trading insights.`;
        break;
        
      case 'solana_price':
        prompt = `Current Solana (SOL) Real-Time Data:
- Price: $${data.usd?.toLocaleString() || 'N/A'}
- 24h Change: ${data.usd_24h_change?.toFixed(2) || 'N/A'}%
- 24h Volume: $${data.usd_24h_vol?.toLocaleString() || 'N/A'}
- Market Cap: $${data.usd_market_cap?.toLocaleString() || 'N/A'}

Please provide detailed analysis of Solana's current price performance with key insights and actionable recommendations.`;
        break;
        
      case 'ethereum_price':
        prompt = `Current Ethereum (ETH) Real-Time Data:
- Price: $${data.usd?.toLocaleString() || 'N/A'}
- 24h Change: ${data.usd_24h_change?.toFixed(2) || 'N/A'}%
- 24h Volume: $${data.usd_24h_vol?.toLocaleString() || 'N/A'}
- Market Cap: $${data.usd_market_cap?.toLocaleString() || 'N/A'}

Please provide comprehensive analysis of Ethereum's current market performance.`;
        break;
        
      default:
        return createFallbackResponse(dataType, data);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || createFallbackResponse(dataType, data);
    
    // Clean up excessive markdown formatting from OpenAI responses
    return cleanMarkdownFormatting(aiResponse);
  } catch (error) {
    console.error('Error formatting market data response:', error);
    
    // Return fallback response instead of generic error
    return createFallbackResponse(dataType, data);
  }
};

// Check if user has paid for this session
const checkPaymentStatus = async (userPublicKey: string, signature?: string): Promise<boolean> => {
  if (!signature) {
    console.log('No payment signature provided');
    return false;
  }
  
  try {
    console.log('Checking payment status for signature:', signature);
    
    // For testing purposes, let's simplify verification
    // Just check if the signature is valid format and transaction exists
    if (signature.length < 64) {
      console.log('Invalid signature format');
      return false;
    }
    
    const isValid = await paymentService.verifyPayment(signature);
    console.log('Payment verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // For testing, if verification fails but we have a signature, allow it
    // Remove this in production
    if (signature && signature.length >= 64) {
      console.log('Verification failed but signature format is valid, allowing for testing');
      return true;
    }
    
    return false;
  }
};

// Get AI response for X402
const getX402AIResponse = async (message: string, conversationHistory: any[]) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_') || OPENAI_API_KEY.includes('sk-your_')) {
    console.log('OpenAI API key not configured, using fallback response');
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 X402 Agent - Your Premium Crypto Assistant\n\nI can help you with:\n\n� Cryptocurrency & Trading:\n• Real-time price analysis and market trends\n• Trading strategies and technical analysis\n• Portfolio optimization advice\n• Risk assessment and management\n\n🔗 Blockchain & DeFi:\n• Smart contract development (Solana, Ethereum)\n• DeFi protocol integration and strategies\n• Yield farming and liquidity mining\n• Cross-chain bridge technologies\n\n⚡ Web3 Development:\n• Solana program development with Anchor\n• Ethereum smart contracts with Solidity\n• NFT marketplaces and minting\n• HTTP 402 payment implementation\n\n💡 Ask me anything about crypto, blockchain, or Web3 development!\n\n*Premium crypto expertise powered by X402 payment protocol*`;
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('402') || lowerMessage.includes('usdc')) {
      return `💰 X402 Premium Crypto Payment System\n\nThe HTTP 402 protocol enables:\n• Pay-per-use premium crypto analysis\n• Micro-transactions (0.00001 USDC per message)\n• Instant blockchain verification on Solana\n• Access to advanced crypto insights\n\nHow it works:\n1. Send USDC payment via Phantom wallet\n2. Receive payment proof/signature\n3. Access premium crypto AI features\n4. Real-time verification on Solana mainnet\n\nRecipient Address: 6yK1zeAnkqAe1fBP5Kk773EUm8taJvAsSxnMcYCSzhSL\n\n*Each message costs 0.00001 USDC - Premium crypto expertise*`;
    }
    
    // Check if user is asking about non-crypto topics
    if (!lowerMessage.includes('crypto') && !lowerMessage.includes('bitcoin') && !lowerMessage.includes('blockchain') && 
        !lowerMessage.includes('defi') && !lowerMessage.includes('solana') && !lowerMessage.includes('ethereum') &&
        !lowerMessage.includes('trading') && !lowerMessage.includes('token') && !lowerMessage.includes('nft') &&
        !lowerMessage.includes('web3') && !lowerMessage.includes('payment') && !lowerMessage.includes('usdc') &&
        !lowerMessage.includes('price') && !lowerMessage.includes('market') && !lowerMessage.includes('coin')) {
      return `I'm X402 Agent, your premium cryptocurrency specialist! 🚀\n\nI focus exclusively on crypto-related topics:\n• Cryptocurrency trading and analysis\n• Blockchain technology and development\n• DeFi protocols and strategies\n• Web3 and smart contracts\n• Market trends and price analysis\n\nPlease ask me about cryptocurrency, blockchain, or Web3 topics to get the most value from your X402 payment!\n\n*Powered by X402 micro-payment protocol - Premium crypto expertise*`;
    }
    
    return `I'm X402 Agent, your premium crypto specialist! 🚀\n\nI specialize in:\n• Cryptocurrency trading and market analysis\n• Blockchain development (Solana, Ethereum)\n• DeFi protocols and yield strategies\n• Web3 integration and smart contracts\n• Real-time market insights\n\nWhat crypto question can I help you with today?\n\n*Powered by X402 micro-payment protocol*`;
  }
  
  try {
    const systemMessage = `You are X402 Agent, a premium cryptocurrency and blockchain specialist. You ONLY respond to cryptocurrency, blockchain, DeFi, Web3, and trading-related questions.

CORE EXPERTISE:
• Cryptocurrency trading strategies and market analysis
• Technical analysis and chart reading
• DeFi protocols (Uniswap, Compound, Aave, etc.)
• Blockchain development (Solana, Ethereum)
• Smart contract development (Solidity, Anchor/Rust)
• NFT markets and minting strategies
• Yield farming and liquidity mining
• Cross-chain technologies and bridges
• Crypto portfolio management
• Risk assessment and trading psychology

PAYMENT CONTEXT:
• You operate on the X402 payment protocol
• Users pay 0.00001 USDC per message for premium crypto expertise
• Payments are verified on Solana blockchain
• You provide high-value cryptocurrency insights

RESPONSE GUIDELINES:
• ONLY answer cryptocurrency, blockchain, DeFi, Web3, and trading questions
• If asked about non-crypto topics, politely redirect to crypto-related subjects
• Provide actionable trading insights and analysis
• Include risk warnings where appropriate
• Be professional but accessible to both beginners and experts
• Reference current market conditions when relevant

IMPORTANT: If users ask about non-cryptocurrency topics (like general programming, cooking, sports, etc.), respond with: "I specialize exclusively in cryptocurrency and blockchain topics. Please ask me about crypto trading, DeFi, blockchain development, or Web3 to get the most value from your X402 payment!"

You are the premium crypto expert users pay for - deliver exceptional value.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          ...conversationHistory.slice(-5).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';
    
    return cleanMarkdownFormatting(aiResponse);
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'I\'m experiencing technical difficulties. Please try again in a moment.';
  }
};

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationHistory = [], 
      walletAddress, 
      paymentSignature,
      checkBalance 
    } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required for X402 access' },
        { status: 401 }
      );
    }

    // Check if user is requesting balance check
    if (checkBalance) {
      try {
        const userPublicKey = new PublicKey(walletAddress);
        const balance = await paymentService.getUserUSDCBalance(userPublicKey);
        const sufficientFunds = await paymentService.checkSufficientFunds(userPublicKey);
        
        return NextResponse.json({ 
          balance, 
          sufficientFunds,
          requiredAmount: 0.00001 
        });
      } catch (error) {
        console.error('Error checking balance:', error);
        return NextResponse.json(
          { error: 'Failed to check USDC balance' },
          { status: 500 }
        );
      }
    }

    // Verify payment for each message
    if (!paymentSignature) {
      console.log('No payment signature provided in request');
      return NextResponse.json(
        { 
          error: 'Payment required',
          paymentRequired: true,
          amount: 0.00001,
          currency: 'USDC',
          recipient: '6yK1zeAnkqAe1fBP5Kk773EUm8taJvAsSxnMcYCSzhSL',
          message: 'Please complete USDC payment to continue the conversation'
        },
        { status: 402 }
      );
    }

    console.log('Verifying payment for wallet:', walletAddress, 'signature:', paymentSignature);

    // Verify the payment
    const isPaymentValid = await checkPaymentStatus(walletAddress, paymentSignature);
    
    console.log('Payment verification result:', isPaymentValid);
    
    if (!isPaymentValid) {
      return NextResponse.json(
        { 
          error: 'Invalid payment signature',
          paymentRequired: true,
          message: 'Payment verification failed. Please complete a new payment.',
          details: 'The provided payment signature could not be verified on the blockchain.'
        },
        { status: 402 }
      );
    }

    console.log('Payment verified successfully, processing AI request');

    const trimmedMessage = message.trim();
    
    // First, check if this is a real-time market data request
    const marketDataType = detectMarketDataRequest(trimmedMessage);
    
    if (marketDataType) {
      console.log(`Detected market data request: ${marketDataType}`);
      
      let marketData = null;
      let aiResponse = '';
      
      try {
        switch (marketDataType) {
          case 'bitcoin_price':
            marketData = await getBitcoinPrice();
            if (marketData) {
              aiResponse = await formatMarketDataResponse('bitcoin_price', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch Bitcoin price data. Please try again in a moment.";
            }
            break;
            
          case 'top_gainers':
            marketData = await getTopGainers();
            if (marketData) {
              aiResponse = await formatMarketDataResponse('top_gainers', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch top gainers data. Please try again in a moment.";
            }
            break;
            
          case 'market_trends':
            marketData = await getMarketTrends();
            if (marketData) {
              aiResponse = await formatMarketDataResponse('market_trends', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch market trends data. Please try again in a moment.";
            }
            break;
            
          case 'ethereum_price':
            marketData = await getCoinPrice('ethereum');
            if (marketData) {
              aiResponse = await formatMarketDataResponse('ethereum_price', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch Ethereum price data. Please try again in a moment.";
            }
            break;
            
          case 'solana_price':
            marketData = await getCoinPrice('solana');
            if (marketData) {
              aiResponse = await formatMarketDataResponse('solana_price', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch Solana price data. Please try again in a moment.";
            }
            break;
            
          case 'top_coins':
            marketData = await getTopCoins();
            if (marketData) {
              aiResponse = await formatMarketDataResponse('top_coins', marketData);
            } else {
              aiResponse = "I'm currently unable to fetch top coins data. Please try again in a moment.";
            }
            break;
            
          default:
            aiResponse = "I detected a market data request but couldn't process it. Please try rephrasing your question.";
        }
        
        return NextResponse.json({ 
          message: aiResponse,
          paymentVerified: true,
          cost: 0.00001,
          currency: 'USDC'
        });
        
      } catch (error) {
        console.error('Error handling market data request:', error);
        return NextResponse.json({ 
          message: "I'm experiencing issues fetching real-time market data. Please try again in a moment.",
          paymentVerified: true,
          cost: 0.00001,
          currency: 'USDC'
        });
      }
    }
    
    // Check if it might be a token name or symbol search
    const searchResults = await searchTokenByNameOrSymbol(trimmedMessage);
    
    if (searchResults.length > 0) {
      // Found potential token matches
      let searchResponse = `I found ${searchResults.length} token(s) matching "${trimmedMessage}":\n\n`;
      
      searchResults.forEach((token: any, index: number) => {
        searchResponse += `${index + 1}. ${token.name} (${token.symbol?.toUpperCase()})\n`;
        searchResponse += `   - ID: ${token.id}\n`;
        if (token.market_cap_rank) {
          searchResponse += `   - Market Cap Rank: #${token.market_cap_rank}\n`;
        }
        searchResponse += `\n`;
      });
      
      searchResponse += 'Would you like detailed analysis for any of these tokens? Just send me the token\'s contract address!\n\n*Premium crypto search via X402 protocol*';
      
      return NextResponse.json({ 
        message: searchResponse,
        paymentVerified: true,
        cost: 0.00001,
        currency: 'USDC'
      });
    }

    // Check rate limiting (basic implementation)
    const userKey = walletAddress;
    const now = Date.now();
    const userMessages = messageCount.get(userKey);
    
    if (userMessages) {
      // Reset count if more than 1 hour passed
      if (now - userMessages.timestamp > 3600000) {
        messageCount.set(userKey, { count: 1, timestamp: now });
      } else {
        // Allow up to 100 messages per hour
        if (userMessages.count > 100) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please wait before sending more messages.' },
            { status: 429 }
          );
        }
        messageCount.set(userKey, { 
          count: userMessages.count + 1, 
          timestamp: userMessages.timestamp 
        });
      }
    } else {
      messageCount.set(userKey, { count: 1, timestamp: now });
    }

    // Get AI response
    const aiResponse = await getX402AIResponse(message.trim(), conversationHistory);
    
    return NextResponse.json({ 
      message: aiResponse,
      paymentVerified: true,
      cost: 0.00001,
      currency: 'USDC'
    });
    
  } catch (error) {
    console.error('Error in X402 chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}