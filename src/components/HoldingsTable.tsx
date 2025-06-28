// src/components/HoldingsTable.tsx

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react'; // AG Grid React Component
import { ColDef, ValueFormatterParams, ICellRendererParams } from 'ag-grid-community'; // AG Grid types
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS


import { ProcessedHolding } from '../api/polymarketApi'; // Adjust path if necessary

interface HoldingsTableProps {
  holdings: ProcessedHolding[];
  fallbackImageUrl: string;
}

// Custom Cell Renderer for the Icon column
const IconCellRenderer: React.FC<ICellRendererParams> = (props) => {
  const imageUrl = props.value;
  const fallbackUrl = (props.colDef?.cellRendererParams as { fallbackUrl: string })?.fallbackUrl;
  
  // Use the provided image URL or fallback
  const finalImageUrl = imageUrl && typeof imageUrl === 'string' && imageUrl !== 'None' ? imageUrl : fallbackUrl;

  return (
    <img
      src={finalImageUrl}
      className="ag-cell-image" // Apply custom image styling defined in CSS
      alt="Market Icon"
      onError={(e) => {
        // Fallback to the generic image if the specific market image fails to load
        (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
};


const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, fallbackImageUrl }) => {
  // Column Definitions for AG Grid
  const columnDefs = useMemo<ColDef<ProcessedHolding>[]>(() => [
    { 
      field: 'icon', 
      headerName: '', // Empty header for the icon column
      width: 60,
      resizable: false, // Icon column usually not resizable
      sortable: false,
      filter: false, // No filter UI for icon column
      cellRenderer: IconCellRenderer, // Use our custom React component for rendering images
      cellRendererParams: {
        fallbackUrl: fallbackImageUrl, // Pass fallback URL to the cell renderer
      },
      // Ensure the cell content is centered and middle-aligned
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0px' }, // Adjust padding if needed for centering
    },
    { 
      field: 'title', 
      headerName: 'Title', 
      flex: 1, // Takes remaining space
      minWidth: 200, 
      resizable: true, 
      sortable: true, 
      filter: true,
      cellStyle: { fontWeight: '500' } 
    },
    { 
      field: 'size', 
      headerName: 'Size', 
      type: 'numericColumn', // Align right, default sorting for numbers
      valueFormatter: (params: ValueFormatterParams) => params.value?.toFixed(4), // Format to 4 decimal places
      width: 120, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'curPrice', 
      headerName: 'Cur Price', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(4)}`,
      width: 120, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'total_pnl', 
      headerName: 'Total PnL', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
      cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' }, // Apply conditional styling
      width: 140, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'realized_pnl', 
      headerName: 'Realized PnL', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
      cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
      width: 140, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'unrealized_pnl', 
      headerName: 'Unrealized PnL', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `$${params.value?.toFixed(2)}`,
      cellClassRules: { 'ag-cell-positive': 'x > 0', 'ag-cell-negative': 'x < 0' },
      width: 140, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'pct_return', 
      headerName: '% Return', 
      type: 'numericColumn', 
      valueFormatter: (params: ValueFormatterParams) => `${params.value?.toFixed(2)}%`,
      cellClassRules: { 'ag-cell-return-positive': 'x > 0', 'ag-cell-return-negative': 'x < 0' }, // For percentage returns
      width: 120, 
      resizable: true, 
      sortable: true, 
      filter: true 
    },
    { 
      field: 'market_link', 
      headerName: 'Link', 
      width: 100, 
      resizable: true, 
      sortable: false, 
      filter: false, // No filter UI for link column
      cellRenderer: (params: ICellRendererParams) => {
        return params.value ? <a href={params.value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Market</a> : '';
      }
    },
    // Wallet column, initially hidden, can be used for filtering by AG-Grid's internal filter
    { 
      field: 'wallet', 
      headerName: 'Wallet', 
      hide: true, // Hidden by default
      filter: true, // Allows filtering if column is shown
    },
  ], [fallbackImageUrl]); // Re-create columnDefs if fallbackImageUrl changes

  // Default properties for all columns
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      resizable: true, // All columns are resizable by default
      sortable: true,  // All columns are sortable by default
      filter: true,    // All columns can be filtered by default (text filter)
      minWidth: 100,
      enableCellTextSelection: true, // Allows text selection in cells
      cellStyle: { verticalAlign: 'middle' }, // Apply vertical middle alignment to all cells
    };
  }, []);

  // AG Grid Options - mimicking Dash's ag-grid-options
  const gridOptions = useMemo(() => ({
    rowHeight: 44, // Matches your Dash app's rowHeight
    headerHeight: 50, // Matches your Dash app's headerHeight
    animateRows: true, // Smooth row animations
    rowSelection: 'multiple', // Allows multiple row selection
    enableRangeSelection: true, // Allows range selection (like Excel)
    enableClipboard: true, // Enable copy-paste
    copyHeadersToClipboard: true, // Include headers when copying
    floatingFilter: true, // Enable always-visible filters in the header
    // enableBrowserTooltips: true, // Enable tooltips on column headers etc.
  }), []);


  if (holdings.length === 0) {
    return <p className="text-center text-gray-400 p-8">No holdings data available.</p>;
  }

  return (
    // AG Grid container. Apply your custom theme and set height.
    // The AG Grid theme handles the box-shadow, background, and rounded corners.
    <div className="ag-theme-alpine-dark" style={{ height: '400px', width: '100%' }}>
      <AgGridReact
        rowData={holdings}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
      />
    </div>
  );
};

export default HoldingsTable;