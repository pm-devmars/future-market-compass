
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PerformanceItem {
  id: string;
  title: string;
  percentChange?: number;
  pnlChange?: number;
  totalPnL?: number;
  currentPrice?: number;
  initialPrice?: number;
}

interface PerformanceTableProps {
  data: PerformanceItem[];
  mode: 'period' | 'all_time';
  type: 'gainers' | 'losers';
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ data, mode, type }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getColorClass = (value: number, isGainer: boolean) => {
    if (isGainer) {
      return value > 0 ? 'text-green-400 font-semibold' : 'text-gray-400';
    } else {
      return value < 0 ? 'text-red-400 font-semibold' : 'text-gray-400';
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-600">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700/30">
            <TableHead className="text-gray-300 font-semibold text-xs">Market</TableHead>
            {mode === 'period' ? (
              <>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">% Change</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">PnL Change</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">Total PnL</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">Total PnL</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">Current</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right text-xs">Initial</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 8).map((item) => (
            <TableRow 
              key={item.id} 
              className="hover:bg-slate-600/20 transition-colors border-slate-600"
            >
              <TableCell className="font-medium text-white text-xs py-2">
                {item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title}
              </TableCell>
              {mode === 'period' ? (
                <>
                  <TableCell className={`text-right text-xs py-2 ${getColorClass(item.percentChange || 0, type === 'gainers')}`}>
                    {formatPercent(item.percentChange || 0)}
                  </TableCell>
                  <TableCell className={`text-right text-xs py-2 ${getColorClass(item.pnlChange || 0, type === 'gainers')}`}>
                    {(item.pnlChange || 0) >= 0 ? '+' : '-'}{formatCurrency(item.pnlChange || 0)}
                  </TableCell>
                  <TableCell className={`text-right text-xs py-2 ${getColorClass(item.totalPnL || 0, type === 'gainers')}`}>
                    {(item.totalPnL || 0) >= 0 ? '+' : '-'}{formatCurrency(item.totalPnL || 0)}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className={`text-right text-xs py-2 ${getColorClass(item.totalPnL || 0, type === 'gainers')}`}>
                    {(item.totalPnL || 0) >= 0 ? '+' : '-'}{formatCurrency(item.totalPnL || 0)}
                  </TableCell>
                  <TableCell className="text-right text-gray-300 text-xs py-2">
                    {formatCurrency(item.currentPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right text-gray-300 text-xs py-2">
                    {formatCurrency(item.initialPrice || 0)}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PerformanceTable;
