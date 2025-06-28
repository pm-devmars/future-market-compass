// src/api/polymarketApi.ts

// Define TypeScript interfaces for the raw data you expect from Polymarket API
export interface RawPolymarketHolding {
  asset: string; // The asset ID (corresponds to token_id in Python price tracker)
  title: string; // Market title
  conditionId: string;
  eventSlug: string; // Used to build market_link
  curPrice: number; // Current price
  initialValue: number; // Initial investment value
  currentValue: number; // Current value of holdings
  realizedPnl: number; // Raw realized PnL
  imageUrl?: string; // Assuming the API might return an image URL for the market
  size?: number; // The size of the holding from raw API response
  [key: string]: any; // Allow for other properties not explicitly defined
}

// Define interface for the processed holdings data (after calculations)
export interface ProcessedHolding {
  asset: string;
  title: string;
  conditionId: string;
  curPrice: number;
  initialValue: number;
  currentValue: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  pct_return: number;
  market_link: string;
  icon: string;
  size: number;
  
  // Fields for price changes over time (for performance leaders)
  pnl_change_period?: number; // Actual PnL change over selected hours (size * asset_price_change)
  asset_price_pct_change_period?: number; // Price percentage change of the asset
  projected_pnl_from_pct_change_period?: number; // Projected PnL change based on asset % change and initial value at start of period
  
  wallet: string; // To store which wallet this holding belongs to (set by App.tsx)
}

// Interfaces for Trade Data
export interface RawPolymarketTrade {
  timestamp: number; // Unix timestamp in seconds
  asset: string;     // Asset ID (token_id)
  side: 'BUY' | 'SELL';
  price: number;
  usdcSize: number; // USDC amount
  size: number;     // Asset amount
  [key: string]: any;
}

export interface ProcessedTrade {
  id: string; // Unique ID for React keys
  timestamp: string; // Formatted date string (e.g., 'YYYY-MM-DD HH:MM:SS AM/PM')
  asset: string;     // Asset ID
  title: string;     // Mapped market title
  side: 'buy' | 'sell'; // Lowercase to match existing TradesTable.tsx
  price: number;
  usdcSize: number; 
  size: number;
  wallet: string;    // Wallet address (set by App.tsx)
}


// Fallback image URL for market icons (defined in Dash app, used if API doesn't provide one)
const FALLBACK_IMAGE_URL_JS = 'https://polymarket.com/_next/image?url=https%3A%2F%2Fpolymarket-upload.s3.us-east-2.amazonaws.com%2Fwill-iran-close-the-strait-of-hormuz-in-2025-8Ws7O_Z5D_TX.jpg&w=256&q=100';

const CLOB_API = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com"; // Data API base URL


/**
 * Fetches current price for a given token ID from Polymarket CLOB API.
 * Corresponds to Python's `get_current_price`.
 */
export async function fetchCurrentPrice(tokenId: string): Promise<number | null> {
    try {
        const response = await fetch(`${CLOB_API}/midpoint?token_id=${tokenId}`);
        if (!response.ok) {
            console.error(`Error fetching current price for ${tokenId}: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return parseFloat(data.mid || 0);
    } catch (error) {
        console.error(`Exception in fetchCurrentPrice for ${tokenId}:`, error);
        return null;
    }
}

/**
 * Fetches price history for a given token ID and time range.
 * Corresponds to Python's `get_price_history_range` / `prices-history` call.
 */
export interface PriceHistoryPoint {
    t: number; // timestamp
    p: number; // price
}

export async function fetchPriceHistory(
    tokenId: string,
    startTs: number,
    endTs: number,
    fidelity: number = 1 // fidelity in minutes
): Promise<PriceHistoryPoint[]> {
    try {
        const url = `${CLOB_API}/prices-history?market=${tokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=${fidelity}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error fetching price history for ${tokenId}: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.history || [];
    } catch (error) {
        console.error(`Exception in fetchPriceHistory for ${tokenId}:`, error);
        return [];
    }
}


/**
 * Gets price at a specific time in the past for a given token ID.
 * Corresponds to Python's `get_price_at_time`.
 */
export interface PriceInfo {
    past_price: number; 
    past_timestamp: number;
    current_price: number;
    change: number; 
    change_percent: number; 
}

export async function getPolymarketPriceAtTime(
    tokenId: string,
    hoursAgo: number
): Promise<PriceInfo | null> {
    try {
        const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
        const timeAgo = now - (hoursAgo * 3600); // Timestamp 'hoursAgo' in the past

        // Fetch current price
        const currentPrice = await fetchCurrentPrice(tokenId);
        if (currentPrice === null) {
            console.warn(`Could not get current price for ${tokenId}. Skipping historical price calculation.`);
            return null;
        }

        // Fetch price history
        const history = await fetchPriceHistory(tokenId, timeAgo, now, 1); // Fidelity 1 minute

        if (history.length === 0) {
            console.warn(`No price history for ${tokenId} in the last ${hoursAgo} hours.`);
            return null;
        }

        // Find closest point to `timeAgo`
        const targetTimestamp = timeAgo;
        const closestPoint = history.reduce((prev, curr) =>
            (Math.abs(curr.t - targetTimestamp) < Math.abs(prev.t - targetTimestamp) ? curr : prev)
        );

        const pastPrice = closestPoint.p;
        const change = currentPrice - pastPrice;
        const changePercent = pastPrice > 0 ? (change / pastPrice) * 100 : 0;

        return {
            past_price: pastPrice, 
            past_timestamp: closestPoint.t,
            current_price: currentPrice,
            change: change,
            change_percent: changePercent
        };

    } catch (error) {
        console.error(`Exception in getPolymarketPriceAtTime for ${tokenId}:`, error);
        return null;
    }
}


/**
 * Fetches holdings data for a given wallet address from Polymarket API
 * and applies similar processing as your Python code.
 * @param walletAddress The Ethereum wallet address.
 * @returns A promise that resolves to an array of ProcessedHolding.
 */
export async function fetchPolymarketHoldings(walletAddress: string): Promise<Omit<ProcessedHolding, 'wallet' | 'pnl_change_period' | 'asset_price_pct_change_period' | 'projected_pnl_from_pct_change_period'>[]> {
  const url = `${DATA_API}/positions?user=${walletAddress}`; // Using new DATA_API constant

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch holdings: ${response.statusText}`);
    }
    const rawData: RawPolymarketHolding[] = await response.json();

    if (!rawData || rawData.length === 0) {
      return []; // Return empty array if no data
    }

    // --- Replicate Python's Data Processing ---
    const processedHoldings: Omit<ProcessedHolding, 'wallet' | 'pnl_change_period' | 'asset_price_pct_change_period' | 'projected_pnl_from_pct_change_period'>[] = rawData.map(item => {
      // Ensure numeric values are actually numbers, handle potential nulls/undefined
      const initialValue = parseFloat(item.initialValue || 0);
      const currentValue = parseFloat(item.currentValue || 0);
      const realizedPnl = parseFloat(item.realizedPnl || 0);
      const curPrice = parseFloat(item.curPrice || 0);
      const size = parseFloat(item.size || 0); 

      const realized_pnl = parseFloat(realizedPnl.toFixed(2));
      const unrealized_pnl = parseFloat((currentValue - initialValue).toFixed(2));
      const total_pnl = parseFloat((realized_pnl + unrealized_pnl).toFixed(2));
      
      let pct_return = 0;
      if (initialValue !== 0) { // Avoid division by zero
        pct_return = parseFloat(((total_pnl / initialValue) * 100).toFixed(2));
      }

      const market_link = `https://polymarket.com/event/${item.eventSlug || ''}`;

      return {
        asset: item.asset,
        title: item.title,
        conditionId: item.id, // Assuming 'id' in RawPolymarketHolding is 'conditionId' or similar
        curPrice: parseFloat(curPrice.toFixed(4)), // Match Python's rounding
        initialValue: parseFloat(initialValue.toFixed(0)), // Match Python's rounding
        currentValue: parseFloat(currentValue.toFixed(2)),
        realized_pnl,
        unrealized_pnl,
        total_pnl,
        pct_return,
        market_link,
        icon: item.imageUrl || FALLBACK_IMAGE_URL_JS, // Use imageUrl from raw data, fallback if not present
        size: size, 
      };
    });

    return processedHoldings;

  } catch (error) {
    console.error("Error fetching or processing Polymarket holdings:", error);
    throw error; // Re-throw to be handled by the component
  }
}

/**
 * Fetches raw trade activity for a given wallet address and time range.
 * Corresponds to Python's `fetch_trades`.
 * @param walletAddress The Ethereum wallet address.
 * @param hours The number of hours back from now to fetch trades.
 * @returns A promise that resolves to an array of RawPolymarketTrade.
 */
export async function fetchPolymarketRawTrades(walletAddress: string, hours: number): Promise<RawPolymarketTrade[]> {
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const start = now - (hours * 3600); // Timestamp 'hoursAgo' in the past

    const url = `${DATA_API}/activity`;
    const params = new URLSearchParams({
        user: walletAddress,
        start: start.toString(),
        end: now.toString(),
        type: "TRADE", // Assuming you only want "TRADE" type events
        limit: "500" // Max limit as per Python code
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch trades: ${response.statusText}`);
        }
        const data: RawPolymarketTrade[] = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Polymarket trades:", error);
        return [];
    }
}

/**
 * Processes raw trade data by mapping asset IDs to titles, formatting timestamps, and adding IDs.
 * @param rawTrades An array of raw trade data.
 * @param assetTitleMap A Map from asset ID (string) to market title (string).
 * @returns An array of processed trade data.
 */
export function processTradesData(rawTrades: RawPolymarketTrade[], assetTitleMap: Map<string, string>): ProcessedTrade[] {
    return rawTrades.map(trade => {
        const timestampDate = new Date(trade.timestamp * 1000); // Convert Unix seconds to milliseconds
        // Format to 'YYYY-MM-DD HH:MM:SS AM/PM' similar to Python's strftime('%Y-%m-%d %I:%M:%S %p')
        // Using toLocaleString for a flexible, readable format. For exact EST, date-fns-tz or moment-timezone is needed.
        const formattedTimestamp = timestampDate.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        // Generate a unique ID for the trade (e.g., timestamp + asset to ensure uniqueness if no other ID present)
        const uniqueId = `${trade.timestamp}-${trade.asset}-${trade.side}-${trade.usdcSize}-${trade.price}`;

        return {
            id: uniqueId, // Add generated ID for React keys
            timestamp: formattedTimestamp,
            asset: trade.asset,
            title: assetTitleMap.get(trade.asset) || `Unknown Market (${trade.asset.substring(0, 8)}...)`, // Map title, provide fallback
            side: trade.side.toLowerCase() as 'buy' | 'sell', // Convert to lowercase to match your component's interface
            price: parseFloat(trade.price?.toFixed(4) || '0'),
            usdcSize: parseFloat(trade.usdcSize?.toFixed(2) || '0'), // Ensure usdcSize is included
            size: parseFloat(trade.size?.toFixed(4) || '0'),
            wallet: trade.wallet || 'N/A' // Wallet will be added by App.tsx, this is a safety fallback
        };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by timestamp descending
}