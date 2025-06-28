
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HoldingsTable from '@/components/HoldingsTable';
import PerformanceTable from '@/components/PerformanceTable';
import TradesTable from '@/components/TradesTable';
import TopicChart from '@/components/TopicChart';
import SummaryCards from '@/components/SummaryCards';
import { generateMockData, type DashboardData } from '@/services/mockDataService';

const Index = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletFilter, setWalletFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState<string[]>([]);
  const [performanceMode, setPerformanceMode] = useState<'period' | 'all_time'>('period');
  const [performanceTab, setPerformanceTab] = useState<'gainers' | 'losers'>('gainers');
  const [hoursFilter, setHoursFilter] = useState('24');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = generateMockData();
      setData(mockData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = generateMockData();
      setData(mockData);
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Polymarket Dashboard</h2>
          <p className="text-gray-400">Fetching your portfolio data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            📊 Polymarket Dashboard
          </h1>
          <p className="text-gray-400">Real-time portfolio tracking and market analysis</p>
        </div>

        {/* Controls */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Addresses</label>
                <Input 
                  placeholder="Enter wallet addresses..." 
                  className="bg-slate-700 border-slate-600 text-white"
                  defaultValue="0x1234...abcd, 0x5678...efgh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Filter</label>
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wallets</SelectItem>
                    <SelectItem value="wallet1">0x1234...abcd</SelectItem>
                    <SelectItem value="wallet2">0x5678...efgh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Period (Hours)</label>
                <Input 
                  value={hoursFilter}
                  onChange={(e) => setHoursFilter(e.target.value)}
                  placeholder="Hours" 
                  className="bg-slate-700 border-slate-600 text-white text-center"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={loadData} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Full Refresh
                </Button>
                <Button 
                  onClick={refreshPrices} 
                  disabled={loading}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                >
                  Prices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <SummaryCards data={data.summary} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Holdings & Topics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Holdings Table */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Portfolio Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HoldingsTable holdings={data.holdings} />
              </CardContent>
            </Card>

            {/* Topic Exposure Chart */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Primary Topic Exposure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopicChart data={data.topicExposure} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Performance & Trades */}
          <div className="space-y-6">
            {/* Performance Leaders */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Performance Leaders
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={performanceMode === 'period' ? 'default' : 'outline'}
                      onClick={() => setPerformanceMode('period')}
                      className="text-xs"
                    >
                      Period
                    </Button>
                    <Button
                      size="sm"
                      variant={performanceMode === 'all_time' ? 'default' : 'outline'}
                      onClick={() => setPerformanceMode('all_time')}
                      className="text-xs"
                    >
                      All Time
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={performanceTab} onValueChange={(v) => setPerformanceTab(v as 'gainers' | 'losers')}>
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                    <TabsTrigger value="gainers" className="text-green-400">🟢 Gainers</TabsTrigger>
                    <TabsTrigger value="losers" className="text-red-400">🔴 Losers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="gainers" className="mt-4">
                    <PerformanceTable 
                      data={data.performance.gainers} 
                      mode={performanceMode}
                      type="gainers"
                    />
                  </TabsContent>
                  <TabsContent value="losers" className="mt-4">
                    <PerformanceTable 
                      data={data.performance.losers} 
                      mode={performanceMode}
                      type="losers"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-orange-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradesTable trades={data.trades} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
