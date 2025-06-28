// src/components/MoversTable.tsx

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';

import { ProcessedHolding } from '../api/polymarketApi'; // Adjust path if necessary

interface MoversTableProps {
  moversData: ProcessedHolding[];
  // Updated mode type to reflect new sorting options
  performanceMode: 'pnl_change_period' | 'asset_price_pct_change_period' | 'projected_pnl_from_pct_change_period' | 'total_pnl'; 
  performanceTab: 'gainers' | 'losers'; // 'gainers' for positive, 'losers' for negative
}

const MoversTable: React.FC<MoversTableProps> = ({ moversData, performanceMode, performanceTab }) => {
  // Define column definitions based on mode
  const columnDefs = useMemo<ColDef<ProcessedHolding>[]>(() => {
    const commonDefs: ColDef<ProcessedHolding>[] = [
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 150, sortable: true, filter: true },
    ];

    if (performanceMode === 'pnl_change_period') {
      return [
        ...commonDefs,
        { 
          field: 'pnl_change_period', 
          headerName: 'PnL Change (Holding)', // Clarified header
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
          cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
          width: 140,
          sortable: true,
        },
        { 
          field: 'asset_price_pct_change_period', // Using the new asset price % change
          headerName: 'Asset Price % Change', 
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(2)}%`,
          cellClassRules: { 'ag-cell-return-positive': 'x > 0', 'ag-cell-return-negative': 'x < 0' },
          width: 150,
          sortable: true,
        },
        { 
          field: 'total_pnl', 
          headerName: 'Total PnL (All Time)', 
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
          cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
          width: 150,
          sortable: true,
        },
      ];
    } else if (performanceMode === 'asset_price_pct_change_period') {
        return [
          ...commonDefs,
          { 
            field: 'asset_price_pct_change_period', 
            headerName: 'Asset Price % Change', // Direct price percent change
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(2)}%`,
            cellClassRules: { 'ag-cell-return-positive': 'x > 0', 'ag-cell-return-negative': 'x < 0' },
            width: 180,
            sortable: true,
          },
          { 
            field: 'curPrice', 
            headerName: 'Current Price', 
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(4)}`,
            width: 130,
            sortable: true,
          },
          { 
            field: 'size', 
            headerName: 'Holding Size', 
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => params.value?.toFixed(4),
            width: 130,
            sortable: true,
          },
        ];
    } else if (performanceMode === 'projected_pnl_from_pct_change_period') {
        return [
          ...commonDefs,
          { 
            field: 'projected_pnl_from_pct_change_period', 
            headerName: 'Projected PnL (Period)', // Projected PnL based on asset % change
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
            cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
            width: 180,
            sortable: true,
          },
          { 
            field: 'asset_price_pct_change_period', 
            headerName: 'Asset Price % Change', 
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(2)}%`,
            cellClassRules: { 'ag-cell-return-positive': 'x > 0', 'ag-cell-return-negative': 'x < 0' },
            width: 180,
            sortable: true,
          },
          { 
            field: 'total_pnl', 
            headerName: 'Total PnL (All Time)', 
            type: 'numericColumn', 
            valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
            cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
            width: 150,
            sortable: true,
          },
        ];
    }
    else { // default to 'total_pnl' (All Time PnL mode)
      return [
        ...commonDefs,
        { 
          field: 'total_pnl', 
          headerName: 'Total PnL (All Time)', 
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
          cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
          width: 150,
          sortable: true,
        },
        { 
          field: 'curPrice', 
          headerName: 'Current Price', 
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(4)}`,
          width: 130,
          sortable: true,
        },
        { 
          field: 'initialValue', 
          headerName: 'Initial Value', 
          type: 'numericColumn', 
          valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(4)}`,
          width: 130,
          sortable: true,
        },
      ];
    }
  }, [performanceMode]);

  // Default properties for all columns
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      resizable: true, // All columns are resizable by default
      sortable: true,  // All columns are sortable by default
      filter: true,    // All columns can be filtered by default (text filter)
      minWidth: 80,
      enableCellTextSelection: true,
      cellStyle: { verticalAlign: 'middle' },
    };
  }, []);

  // Grid options for Movers table
  const gridOptions = useMemo(() => ({
    rowHeight: 44,
    headerHeight: 40, // Slightly smaller header for movers
    animateRows: true,
    floatingFilter: true, // <<< ADDED: Enable always-visible filters in the header
    // No row selection or clipboard for this table by default
  }), []);


  if (moversData.length === 0) {
    return (
      <div className="bg-[#1e1e2e] text-[#a0aec0] p-8 rounded-md h-48 flex items-center justify-center text-center text-lg italic">
        No performance data available for this selection.
      </div>
    );
  }

  return (
    <div className="ag-theme-alpine-dark" style={{ height: '280px', width: '100%' }}>
      <AgGridReact
        rowData={moversData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
      />
    </div>
  );
};

export default MoversTable;