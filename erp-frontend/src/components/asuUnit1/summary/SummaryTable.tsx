import React, { useMemo } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import SummaryTableRow from './SummaryTableRow';
import { formatYarnTypeDisplay, getYarnTypeColor } from './utils';

interface SummaryTableProps {
  data: any[];
  distinctYarnTypes: string[];
  activeMachineYarnTypes: string[];
  yarnTotals: Record<string, number>;
  grandTotal: number;
  productionWeightedAvgEfficiency: number;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

const SummaryTable: React.FC<SummaryTableProps> = ({
  data,
  distinctYarnTypes,
  activeMachineYarnTypes,
  yarnTotals,
  grandTotal,
  productionWeightedAvgEfficiency,
  loading,
  error,
  refreshing,
  lastRefreshed,
  onRefresh
}) => {
  
  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-lg">Loading yarn production data...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="p-3 mb-4 rounded-full bg-red-50 dark:bg-red-900/30">
            <div className="w-10 h-10 text-red-500 dark:text-red-400">⚠️</div>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{error}</p>
          <Button onClick={onRefresh} className="mt-4">Try Again</Button>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="p-3 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <Package className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No production data available</p>
          <p className="max-w-md mt-2 text-gray-500 dark:text-gray-400">
            Production data will appear here once machines start generating yarn production entries.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="w-full overflow-x-auto">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto relative">
            <Table className="w-full min-w-full table-fixed">
              <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                <TableRow className="border-b dark:border-gray-700">
                  <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px] bg-gray-50 dark:bg-gray-800">
                    Date
                  </TableHead>
                  {distinctYarnTypes.map((yarnType, index) => {
                    const displayName = formatYarnTypeDisplay(yarnType);
                    const isActiveMachineYarn = activeMachineYarnTypes.includes(yarnType);
                    return (
                      <TableHead
                        key={`yarn-type-${yarnType}-${index}`}
                        className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px] bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className={`inline-block w-2 h-2 mb-1 rounded-full ${getYarnTypeColor(yarnType)}`}></span>
                          <span className="font-semibold">{displayName}</span>
                          {isActiveMachineYarn && (
                            <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-indigo-600 uppercase sm:px-6 dark:text-indigo-400 w-[140px] bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-col items-center justify-center">
                      <span className="inline-block w-2 h-2 mb-1 bg-indigo-500 rounded-full"></span>
                      Total (All Types)
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px] bg-gray-50 dark:bg-gray-800">
                    Machines
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px] bg-gray-50 dark:bg-gray-800">
                    Avg Efficiency
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, index) => (
                  <SummaryTableRow 
                    key={row.date || index} 
                    row={row} 
                    distinctYarnTypes={distinctYarnTypes} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Totals Footer */}
        <div className="mt-4 w-full overflow-x-auto">
          <Table className="w-full min-w-full table-fixed">
            <TableBody>
              <TableRow className="bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800">
                <TableCell className="px-4 py-3 font-semibold text-left whitespace-nowrap sm:px-6 text-indigo-700 dark:text-indigo-300 w-[120px]">
                  Totals
                </TableCell>
                {distinctYarnTypes.map((yarnType, idx) => (
                  <TableCell
                    key={`outside-total-${yarnType}-${idx}`}
                    className="px-4 py-3 font-semibold text-center whitespace-nowrap sm:px-6 w-[100px]"
                  >
                    <span className="text-indigo-700 dark:text-indigo-300">
                      {(yarnTotals[yarnType] || 0).toFixed(2)}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                    </span>
                  </TableCell>
                ))}
                <TableCell className="px-4 py-3 font-bold text-center whitespace-nowrap sm:px-6 text-indigo-800 dark:text-indigo-200 w-[140px]">
                  {grandTotal.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">kg</span>
                </TableCell>
                <TableCell className="px-4 py-3 text-center whitespace-nowrap sm:px-6 w-[100px]">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">—</span>
                </TableCell>
                <TableCell className="px-4 py-3 text-center whitespace-nowrap sm:px-6 w-[120px]">
                  <span className="inline-flex items-center gap-1 text-indigo-800 dark:text-indigo-200 font-semibold">
                    {productionWeightedAvgEfficiency.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </>
    );
  }, [data, distinctYarnTypes, activeMachineYarnTypes, yarnTotals, grandTotal, productionWeightedAvgEfficiency, loading, error, onRefresh]);

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Yarn Production Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Daily production totals grouped by yarn type
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Last refreshed:{" "}
                {lastRefreshed.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              size="sm"
              variant="default"
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 pb-6">
        {tableContent}
      </div>
    </div>
  );
};

export default React.memo(SummaryTable);
