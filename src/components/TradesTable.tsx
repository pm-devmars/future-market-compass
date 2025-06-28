// src/components/TradesTable.tsx

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react'; // AG Grid React Component
import { ColDef, ValueFormatterParams, ICellRendererParams } from 'ag-grid-community'; // AG Grid types
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS

import { ProcessedTrade } from '../api/polymarketApi'; // Adjust path if necessary

interface TradesTableProps {
  trades: ProcessedTrade[];
}

const TradesTable: React.FC<TradesTableProps> = ({ trades }) => {
  // Column Definitions for AG Grid
  const columnDefs = useMemo<ColDef<ProcessedTrade>[]>(() => [
    { 
      field: 'timestamp', 
      headerName: 'Timestamp', 
      minWidth: 180, 
      resizable: true, 
      sortable: true, 
      filter: true,
      sort: 'desc', // Default sort by timestamp, newest first
      // Custom cell renderer for BUY/SELL color if needed (AG Grid has built-in ways too)
      cellRenderer: (params: ICellRendererParams) => {
        // Assuming params.value is 'YYYY-MM-DD HH:MM:SS AM/PM'
        try {
            const date = new Date(params.value);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            return params.value; // Fallback
        }
      },
      valueGetter: (params) => {
        // Use a valueGetter to provide a sortable/filterable Date object
        return new Date(params.data.timestamp);
      },
      valueFormatter: (params) => {
        // This is only for display, not for sorting/filtering
        if (!params.value) return '';
        return params.value.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    },
    { 
      field: 'title', 
      headerName: 'Market', 
      flex: 1, 
      minWidth: 200, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'side', 
      headerName: 'Side', 
      width: 100, 
      resizable: true, 
      sortable: true, 
      filter: true,
      cellClassRules: {
        // Apply classes based on 'side' value (BUY/SELL from ProcessedTrade)
        'ag-cell-positive': 'value.toLowerCase() === "buy"',  // Assuming BUY is positive
        'ag-cell-negative': 'value.toLowerCase() === "sell"', // Assuming SELL is negative
      },
      valueFormatter: (params: ValueFormatterParams) => params.value?.toUpperCase(), // Display as BUY/SELL
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(4)}`,
      width: 120, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'size', 
      headerName: 'Size', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => params.value?.toFixed(4),
      width: 120, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'usdcSize', 
      headerName: 'USDC Size', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
      width: 130, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'wallet', 
      headerName: 'Wallet', 
      hide: true, // Hidden by default, useful for filtering
      filter: true 
    },
  ], []);

  // Default properties for all columns
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      resizable: true,
      sortable: true,
      filter: true, // All columns can be filtered by default (text filter)
      minWidth: 80,
      enableCellTextSelection: true,
      cellStyle: { verticalAlign: 'middle' },
    };
  }, []);

  // Grid options for Trades table
  const gridOptions = useMemo(() => ({
    rowHeight: 44,
    headerHeight: 40, // Consistent header height with MoversTable
    animateRows: true,
    floatingFilter: true, // Enable always-visible filters
    // This will display a message inside the grid area when no rows are present
    overlayNoRowsTemplate: '<span class="text-gray-400 p-8 text-lg italic">No recent trade activity found.</span>',
  }), []);

  return (
    // AG Grid container. Apply your custom theme and set height.
    // AG Grid will automatically handle empty state by showing overlayNoRowsTemplate
    <div className="ag-theme-alpine-dark" style={{ height: '300px', width: '100%' }}>
      <AgGridReact
        rowData={trades}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
      />
    </div>
  );
};

export default TradesTable;