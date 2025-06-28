
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SummaryData {
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  cashBalance: number;
}

interface SummaryCardsProps {
  data: SummaryData;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getIcon = (value: number, type: 'pnl' | 'cash') => {
    if (type === 'cash') return <Wallet className="w-6 h-6 text-blue-400" />;
    if (value > 0) return <TrendingUp className="w-6 h-6 text-green-400" />;
    if (value < 0) return <TrendingDown className="w-6 h-6 text-red-400" />;
    return <DollarSign className="w-6 h-6 text-gray-400" />;
  };

  const cards = [
    {
      title: 'Realized PnL',
      value: data.realizedPnL,
      type: 'pnl' as const,
    },
    {
      title: 'Unrealized PnL',
      value: data.unrealizedPnL,
      type: 'pnl' as const,
    },
    {
      title: 'Total PnL',
      value: data.totalPnL,
      type: 'pnl' as const,
    },
    {
      title: 'Cash Balance',
      value: data.cashBalance,
      type: 'cash' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200 hover:scale-105"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${getColorClass(card.value)} mt-1`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
              <div className="flex-shrink-0">
                {getIcon(card.value, card.type)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
