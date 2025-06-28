
export interface DashboardData {
  summary: {
    realizedPnL: number;
    unrealizedPnL: number;
    totalPnL: number;
    cashBalance: number;
  };
  holdings: Array<{
    id: string;
    icon: string;
    title: string;
    size: number;
    currentPrice: number;
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    cash: number;
  }>;
  performance: {
    gainers: Array<{
      id: string;
      title: string;
      percentChange: number;
      pnlChange: number;
      totalPnL: number;
      currentPrice: number;
      initialPrice: number;
    }>;
    losers: Array<{
      id: string;
      title: string;
      percentChange: number;
      pnlChange: number;
      totalPnL: number;
      currentPrice: number;
      initialPrice: number;
    }>;
  };
  trades: Array<{
    id: string;
    timestamp: string;
    title: string;
    side: 'buy' | 'sell';
    price: number;
    size: number;
  }>;
  topicExposure: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const mockMarkets = [
  "Will Trump win the 2024 election?",
  "Will Bitcoin reach $100k in 2024?",
  "Will there be a recession in 2024?",
  "Will AI achieve AGI by 2025?",
  "Will SpaceX land on Mars by 2026?",
  "Will Ukraine war end in 2024?",
  "Will Fed cut rates below 3% in 2024?",
  "Will Tesla stock hit $300 in 2024?",
  "Will ChatGPT-5 be released in 2024?",
  "Will there be a major cyber attack in 2024?",
  "Will inflation drop below 2% in 2024?",
  "Will China invade Taiwan by 2025?",
  "Will remote work become permanent?",
  "Will climate change targets be met?",
  "Will quantum computing breakthrough happen?",
];

const topics = [
  { name: 'Politics', color: '#3B82F6' },
  { name: 'Crypto', color: '#F59E0B' },
  { name: 'Economics', color: '#10B981' },
  { name: 'Technology', color: '#8B5CF6' },
  { name: 'Space', color: '#F97316' },
  { name: 'Geopolitics', color: '#EF4444' },
  { name: 'Finance', color: '#06B6D4' },
  { name: 'AI', color: '#EC4899' },
];

const fallbackIcon = 'https://polymarket.com/_next/image?url=https%3A%2F%2Fpolymarket-upload.s3.us-east-2.amazonaws.com%2Fwill-iran-close-the-strait-of-hormuz-in-2025-8Ws7O_Z5D_TX.jpg&w=256&q=100';

export const generateMockData = (): DashboardData => {
  // Generate holdings
  const holdings = Array.from({ length: 12 }, (_, i) => {
    const totalPnL = (Math.random() - 0.4) * 5000;
    const realizedPnL = totalPnL * (0.3 + Math.random() * 0.4);
    const unrealizedPnL = totalPnL - realizedPnL;
    
    return {
      id: `holding-${i}`,
      icon: fallbackIcon,
      title: mockMarkets[i % mockMarkets.length],
      size: Math.random() * 1000 + 100,
      currentPrice: Math.random() * 0.8 + 0.1,
      totalPnL,
      realizedPnL,
      unrealizedPnL,
      cash: Math.random() * 10000 + 1000,
    };
  });

  // Generate performance data
  const generatePerformanceData = (isGainers: boolean) => {
    return Array.from({ length: 10 }, (_, i) => {
      const percentChange = isGainers 
        ? Math.random() * 50 + 5 
        : -(Math.random() * 30 + 5);
      const pnlChange = percentChange * (Math.random() * 100 + 50);
      const totalPnL = pnlChange + (Math.random() - 0.5) * 2000;
      const currentPrice = Math.random() * 0.8 + 0.1;
      const initialPrice = currentPrice - (percentChange / 100) * currentPrice;

      return {
        id: `perf-${isGainers ? 'gainer' : 'loser'}-${i}`,
        title: mockMarkets[i % mockMarkets.length],
        percentChange,
        pnlChange,
        totalPnL,
        currentPrice,
        initialPrice,
      };
    });
  };

  // Generate trades
  const trades = Array.from({ length: 25 }, (_, i) => ({
    id: `trade-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    title: mockMarkets[i % mockMarkets.length],
    side: Math.random() > 0.5 ? 'buy' as const : 'sell' as const,
    price: Math.random() * 0.8 + 0.1,
    size: Math.random() * 5000 + 500,
  }));

  // Generate topic exposure
  const topicExposure = topics.map(topic => ({
    name: topic.name,
    value: Math.floor(Math.random() * 10) + 1,
    color: topic.color,
  }));

  // Calculate summary
  const summary = {
    realizedPnL: holdings.reduce((sum, h) => sum + h.realizedPnL, 0),
    unrealizedPnL: holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0),
    totalPnL: holdings.reduce((sum, h) => sum + h.totalPnL, 0),
    cashBalance: holdings.reduce((sum, h) => sum + h.cash, 0),
  };

  return {
    summary,
    holdings,
    performance: {
      gainers: generatePerformanceData(true),
      losers: generatePerformanceData(false),
    },
    trades: trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    topicExposure,
  };
};
