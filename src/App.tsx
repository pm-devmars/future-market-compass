// src/App.tsx

import React, { useState, useEffect, useMemo } from 'react'; 
import { fetchPolymarketHoldings, getPolymarketPriceAtTime, fetchPolymarketRawTrades, processTradesData, ProcessedHolding, ProcessedTrade } from './api/polymarketApi'; 
import HoldingsTable from './components/HoldingsTable'; 
import MoversTable from './components/MoversTable';     
import TradesTable from './components/TradesTable';     // Import the TradesTable component

const App: React.FC = () => {
  // State for fetched holdings data (unfiltered by wallet dropdown)
  const [allHoldingsData, setAllHoldingsData] = useState<ProcessedHolding[]>([]); 
  // State for fetched trades data
  const [allTradesData, setAllTradesData] = useState<ProcessedTrade[]>([]); 
  // State for loading and error indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // State for the wallet address input field (now expects comma-separated)
  const [walletAddressInput, setWalletAddressInput] = useState<string>('0xbe89905ca9a689f5129621b62fcf71'); // <<< IMPORTANT: Replace with a real default wallet address (or comma-separated list)
  // State for the hours selector input
  const [hourSelector, setHourSelector] = useState<string>('24'); // Default to 24 hours
  
  // State for summary PnL cards
  const [realizedPnl, setRealizedPnl] = useState<number>(0);
  const [unrealizedPnl, setUnrealizedPnl] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [cashBalance, setCashBalance] = useState<number>(0); // Placeholder for cash balance

  // State for Performance Leaders filters
  const [performanceMode, setPerformanceMode] = useState<'pnl_change_period' | 'asset_price_pct_change_period' | 'projected_pnl_from_pct_change_period' | 'total_pnl'>('pnl_change_period'); 
  const [performanceTab, setPerformanceTab] = useState<'gainers' | 'losers'>('gainers'); 

  // State for Wallet Filter Dropdown
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('all'); 


  // Fallback image URL for market icons (defined in Dash app, used if API doesn't provide one)
  const FALLBACK_IMAGE_URL_JS = 'https://polymarket.com/_next/image?url=https%3A%2F%2Fpolymarket-upload.s3.us-east-2.amazonaws.com%2Fwill-iran-close-the-strait-of-hormuz-in-2025-8Ws7O_Z5D_TX.jpg&w=256&q=100';


  // Main function to fetch and process all dashboard data (holdings and trades)
  const loadAllDashboardData = async () => { // Renamed from loadHoldings for clarity
    const inputWallets = walletAddressInput
                           .split(',')
                           .map(addr => addr.trim())
                           .filter(addr => addr.length > 0 && addr.startsWith('0x')); 

    if (inputWallets.length === 0) {
      setAllHoldingsData([]);
      setAllTradesData([]); // Reset trades too
      setRealizedPnl(0);
      setUnrealizedPnl(0);
      setTotalPnl(0);
      setCashBalance(0);
      setLoading(false); 
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // --- PART 1: Fetch and Process Holdings Data ---
      const allFetchedHoldingsPromises = inputWallets.map(async (address) => {
          try {
              const holdingsForWallet = await fetchPolymarketHoldings(address);
              // Add the wallet address to each holding for tracking
              return holdingsForWallet.map(h => ({ ...h, wallet: address })); 
          } catch (walletError) {
              console.error(`Error fetching holdings for wallet ${address}:`, walletError);
              return []; 
          }
      });

      const holdingsResults = await Promise.allSettled(allFetchedHoldingsPromises);
      let aggregatedHoldings: ProcessedHolding[] = [];
      holdingsResults.forEach(result => {
          if (result.status === 'fulfilled') {
              aggregatedHoldings = aggregatedHoldings.concat(result.value);
          }
      });

      // Optional: Aggregate duplicate holdings for the same asset from different wallets
      const combinedHoldingsMap = new Map<string, ProcessedHolding>(); 
      aggregatedHoldings.forEach(holding => {
          if (combinedHoldingsMap.has(holding.asset)) {
              const existing = combinedHoldingsMap.get(holding.asset)!;
              combinedHoldingsMap.set(holding.asset, {
                  ...existing,
                  size: (existing.size || 0) + (holding.size || 0),
                  initialValue: (existing.initialValue || 0) + (holding.initialValue || 0),
                  currentValue: (existing.currentValue || 0) + (holding.currentValue || 0),
                  realized_pnl: (existing.realized_pnl || 0) + (holding.realized_pnl || 0),
                  unrealized_pnl: (existing.unrealized_pnl || 0) + (holding.unrealized_pnl || 0),
                  total_pnl: (existing.total_pnl || 0) + (holding.total_pnl || 0),
              });
          } else {
              combinedHoldingsMap.set(holding.asset, holding);
          }
      });
      const holdingsToProcess = Array.from(combinedHoldingsMap.values());
      
      const hours = parseInt(hourSelector, 10);
      const validHours = isNaN(hours) || hours <= 0 ? 24 : hours;

      const assetPriceInfoMap = new Map<string, { change: number, change_percent: number, past_price: number }>(); 
      const uniqueAssets = Array.from(new Set(holdingsToProcess.map(h => h.asset))); 

      await Promise.allSettled(uniqueAssets.map(async (assetId) => {
        try {
          const priceInfo = await getPolymarketPriceAtTime(assetId, validHours);
          if (priceInfo) {
            assetPriceInfoMap.set(assetId, { change: priceInfo.change, change_percent: priceInfo.change_percent, past_price: priceInfo.past_price });
          }
        } catch (e) {
          console.warn(`Failed to get price info for asset ${assetId}:`, e);
        }
      }));

      const finalHoldings = holdingsToProcess.map((holding) => {
        const priceChangeInfo = assetPriceInfoMap.get(holding.asset);

        const asset_price_pct_change_period = priceChangeInfo?.change_percent ?? 0;
        const pnl_change_period = (priceChangeInfo?.change ?? 0) * holding.size; 
        
        const projected_pnl_from_pct_change_period = 
          (asset_price_pct_change_period / 100) * (holding.size * (priceChangeInfo?.past_price ?? 0));


        const newHolding = {
          ...holding,
          pnl_change_period: parseFloat(pnl_change_period.toFixed(2)),
          asset_price_pct_change_period: parseFloat(asset_price_pct_change_period.toFixed(2)),
          projected_pnl_from_pct_change_period: parseFloat(projected_pnl_from_pct_change_period.toFixed(2)),
        };

        if (holding.initialValue !== 0 && combinedHoldingsMap.has(holding.asset)) {
          newHolding.pct_return = parseFloat(((newHolding.total_pnl / newHolding.initialValue) * 100).toFixed(2));
        }

        return newHolding;
      });

      setAllHoldingsData(finalHoldings); 

      // --- PART 2: Fetch and Process Trades Data ---
      const allFetchedTradesPromises = inputWallets.map(async (address) => {
        try {
            const tradesForWallet = await fetchPolymarketRawTrades(address, validHours);
            // Add wallet address to raw trades for processing
            return tradesForWallet.map(trade => ({...trade, wallet: address}));
        } catch (tradeError) {
            console.error(`Error fetching trades for wallet ${address}:`, tradeError);
            return [];
        }
      });

      const tradesResults = await Promise.allSettled(allFetchedTradesPromises);
      let aggregatedRawTrades: (RawPolymarketTrade & { wallet: string })[] = [];
      tradesResults.forEach(result => {
        if (result.status === 'fulfilled') {
          aggregatedRawTrades = aggregatedRawTrades.concat(result.value);
        }
      });

      // Create a map of asset IDs to titles from the final holdings data for trade processing
      const assetTitleMap = new Map<string, string>();
      finalHoldings.forEach(h => {
        assetTitleMap.set(h.asset, h.title);
      });

      const processedTrades = processTradesData(aggregatedRawTrades, assetTitleMap);
      setAllTradesData(processedTrades);


    } catch (err: any) {
      setError(err.message);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effect hook to load all dashboard data
  useEffect(() => {
    loadAllDashboardData();
  }, [walletAddressInput, hourSelector]); 


  // --- Filtered Holdings Data (for display in HoldingsTable) ---
  const filteredHoldings = useMemo(() => {
    if (selectedWalletFilter === 'all') {
      return allHoldingsData;
    }
    return allHoldingsData.filter(holding => holding.wallet === selectedWalletFilter);
  }, [allHoldingsData, selectedWalletFilter]);

  // --- Filtered Trades Data (for display in TradesTable) ---
  const filteredTrades = useMemo(() => {
    // If a wallet filter is applied, also filter trades
    if (selectedWalletFilter === 'all') {
      // Sort to ensure the most recent 25 are always shown from the full dataset
      return allTradesData.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
    }
    return allTradesData
      .filter(trade => trade.wallet === selectedWalletFilter)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 25); // Limit to top 25 trades for the filtered wallet
  }, [allTradesData, selectedWalletFilter]);


  // --- Wallet Filter Options ---
  const walletFilterOptions = useMemo(() => {
    const uniqueWallets = Array.from(new Set(allHoldingsData.map(h => h.wallet)));
    const options = uniqueWallets.map(wallet => ({
      label: `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`,
      value: wallet
    }));
    return [{ label: 'All Wallets', value: 'all' }, ...options];
  }, [allHoldingsData]);

  // --- Update Summary PnL & Cash from FILTERED Holdings ---
  useEffect(() => {
    if (filteredHoldings.length > 0) {
      const totalRealized = filteredHoldings.reduce((sum, h) => sum + h.realized_pnl, 0);
      const totalUnrealized = filteredHoldings.reduce((sum, h) => sum + h.unrealized_pnl, 0);
      const totalTotal = filteredHoldings.reduce((sum, h) => sum + h.total_pnl, 0);
      
      const currentCashDummy = 50000; 
      
      setRealizedPnl(totalRealized);
      setUnrealizedPnl(totalUnrealized);
      setTotalPnl(totalTotal);
      setCashBalance(currentCashDummy); 
    } else {
      setRealizedPnl(0);
      setUnrealizedPnl(0);
      setTotalPnl(0);
      setCashBalance(0);
    }
  }, [filteredHoldings]); 


  // Helper function to render PnL cards with conditional styling
  const renderPnlCard = (title: string, value: number, isCash = false) => {
    let icon = "➖";
    let color = "#a0aec0"; 

    if (isCash) {
      icon = "💰";
      color = "#4299e1"; 
    } else if (value > 0) {
      icon = "📈";
      color = "#10b981"; 
    } else if (value < 0) {
      icon = "📉";
      color = "#ef4444"; 
    }

    return (
      <div className="w-full md:w-1/4 px-2 mb-4"> 
        <div className="custom-card"> 
          <div className="custom-card-header text-center">{title}</div>
          <div className="custom-card-body flex items-center justify-center text-center">
            <span style={{ marginRight: '8px', fontSize: '1.8rem' }}>{icon}</span>
            <span style={{ color: color, fontWeight: 'bold', fontSize: '1.8rem' }}>
              ${value.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- Logic for Performance Leaders (Movers Table) ---
  const getMoversData = (): ProcessedHolding[] => {
    let sortedData = [...filteredHoldings]; 

    sortedData.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (performanceMode === 'pnl_change_period') {
          valA = a.pnl_change_period ?? 0;
          valB = b.pnl_change_period ?? 0;
      } else if (performanceMode === 'asset_price_pct_change_period') {
          valA = a.asset_price_pct_change_period ?? 0;
          valB = b.asset_price_pct_change_period ?? 0;
      } else if (performanceMode === 'projected_pnl_from_pct_change_period') {
          valA = a.projected_pnl_from_pct_change_period ?? 0;
          valB = b.projected_pnl_from_pct_change_period ?? 0;
      } else if (performanceMode === 'total_pnl') { 
          valA = a.total_pnl ?? 0;
          valB = b.total_pnl ?? 0;
      }

      return performanceTab === 'gainers' ? valB - valA : valA - valB; 
    });
    
    return sortedData.slice(0, 10);
  };

  const moversData = getMoversData();

  return (
    <div className="custom-container mx-auto my-4"> 
      <h1 className="text-2xl font-bold text-center mb-2">📊 Polymarket Dashboard</h1>
      <p className="text-center text-gray-400 mb-8">Real-time portfolio tracking and market analysis</p>

      {/* Wallet Input and Refresh Buttons Row */}
      <div className="flex flex-wrap items-center -mx-2 mb-6"> 
        <div className="w-full md:w-9/12 px-2 mb-4 md:mb-0"> 
          <input
            id="wallet-input"
            type="text"
            className="custom-form-control" 
            placeholder="Enter wallet addresses (comma-separated)..." 
            value={walletAddressInput}
            onChange={(e) => setWalletAddressInput(e.target.value)}
          />
        </div>
        <div className="w-1/2 md:w-2/12 px-2 mb-4 md:mb-0"> 
          <button id="btn-full-refresh" className="custom-btn-success w-full" onClick={loadAllDashboardData}>Full Refresh</button>
        </div>
        <div className="w-1/2 md:w-1/12 px-2 mb-4 md:mb-0"> 
          <button id="btn-price-refresh" className="custom-btn-info w-full" onClick={loadAllDashboardData}>Prices</button> 
        </div>
      </div>

      {/* Dropdowns Row (Wallet Filter and Hour Selector) */}
      <div className="flex flex-wrap items-center -mx-2 mb-6">
        <div className="w-full md:w-5/12 px-2 mb-4 md:mb-0">
          {/* Wallet Filter Dropdown */}
          <select
            id="wallet-filter"
            className="custom-form-control"
            value={selectedWalletFilter}
            onChange={(e) => setSelectedWalletFilter(e.target.value)}
          >
            {walletFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-4/12 px-2 mb-4 md:mb-0">
          {/* Placeholder for Topic Filter Dropdown */}
          <div className="custom-form-control p-2 text-gray-400">Topic Filter Placeholder</div>
        </div>
        <div className="w-full md:w-3/12 px-2">
          {/* Hour Selector Input */}
          <input
            id="hour-selector"
            type="text"
            placeholder="Hours"
            list="hour-options" 
            value={hourSelector}
            onChange={(e) => setHourSelector(e.target.value)}
            className="custom-form-control text-center"
          />
          <datalist id="hour-options">
            <option value="1" />
            <option value="24" />
            <option value="168" />
          </datalist>
        </div>
      </div>

      {/* PnL Summary Cards Row */}
      <div className="flex flex-wrap -mx-2 mb-6 text-center">
        {renderPnlCard("Realized PnL", realizedPnl)}
        {renderPnlCard("Unrealized PnL", unrealizedPnl)}
        {renderPnlCard("Total PnL", totalPnl)}
        {renderPnlCard("Cash Balance", cashBalance, true)} 
      </div>

      {/* Main Content Row (Portfolio Holdings & Right Panel) */}
      <div className="flex flex-wrap -mx-2">
        {/* Left Column: Portfolio Holdings & Topic Pie Chart */}
        <div className="w-full md:w-8/12 px-2 mb-6 md:mb-0">
          <h4 className="text-xl font-semibold mb-4">📊 Portfolio Holdings</h4>
          {loading && <p className="text-center text-gray-400">Loading holdings data...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {/* Render HoldingsTable component */}
          {!loading && !error && (
              <HoldingsTable holdings={filteredHoldings} fallbackImageUrl={FALLBACK_IMAGE_URL_JS} />
          )}

          <h4 className="text-xl font-semibold mb-4 mt-6">🥧 Primary Topic Exposure</h4>
          {/* Placeholder for Topic Pie Chart */}
          <div className="custom-card p-4 h-64 flex items-center justify-center text-gray-400">
            Pie Chart Placeholder
          </div>
        </div>

        {/* Right Column: Performance Leaders & Recent Activity */}
        <div className="w-full md:w-4/12 px-2">
          {/* Performance Leaders Section */}
          <div className="custom-card mb-2"> {/* MODIFIED: Reduced mb-6 to mb-2 to reduce space */}
            <div className="custom-card-header flex items-center justify-between">
              <span>🚀 Performance Leaders</span>
              <div className="flex space-x-2"> {/* Button group for performance metric selection */}
                <button
                  className={performanceMode === 'pnl_change_period' ? 'custom-btn-primary px-3 py-1 text-sm' : 'custom-btn-secondary px-3 py-1 text-sm'}
                  onClick={() => setPerformanceMode('pnl_change_period')}
                >
                  PnL Change
                </button>
                <button
                  className={performanceMode === 'asset_price_pct_change_period' ? 'custom-btn-primary px-3 py-1 text-sm' : 'custom-btn-secondary px-3 py-1 text-sm'}
                  onClick={() => setPerformanceMode('asset_price_pct_change_period')}
                >
                  Price % Change
                </button>
                <button
                  className={performanceMode === 'projected_pnl_from_pct_change_period' ? 'custom-btn-primary px-3 py-1 text-sm' : 'custom-btn-secondary px-3 py-1 text-sm'}
                  onClick={() => setPerformanceMode('projected_pnl_from_pct_change_period')}
                >
                  Projected PnL
                </button>
                <button
                  className={performanceMode === 'total_pnl' ? 'custom-btn-primary px-3 py-1 text-sm' : 'custom-btn-secondary px-3 py-1 text-sm'}
                  onClick={() => setPerformanceMode('total_pnl')}
                >
                  All Time PnL
                </button>
              </div>
            </div>
            <div className="custom-card-body p-4">
              {/* Tabs for Gainers/Losers */}
              <div className="flex mb-4">
                <button
                  className={performanceTab === 'gainers' ? 'custom-btn-primary px-3 py-1 text-sm rounded-r-none' : 'custom-btn-secondary px-3 py-1 text-sm rounded-r-none'}
                  onClick={() => setPerformanceTab('gainers')}
                >
                  🟢 Gainers
                </button>
                <button
                  className={performanceTab === 'losers' ? 'custom-btn-primary px-3 py-1 text-sm rounded-l-none' : 'custom-btn-secondary px-3 py-1 text-sm rounded-l-none'}
                  onClick={() => setPerformanceTab('losers')}
                >
                  🔴 Losers
                </button>
              </div>
              {/* Render MoversTable */}
              <MoversTable moversData={moversData} performanceMode={performanceMode} performanceTab={performanceTab} />
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="custom-card">
            <div className="custom-card-header">📋 Recent Activity</div>
            <div className="custom-card-body p-4">
              {/* Render TradesTable */}
              <TradesTable trades={filteredTrades} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;