import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Calendar, Package } from 'lucide-react';
import { YarnProductionSummaryRow } from './types';
import {
  formatDate,
  formatYarnTypeDisplay,
  getEfficiencyBadgeClass,
  getEfficiencyColorClass,
  getYarnTypeColor
} from './utils';

interface YarnSummaryTableProps {
  summaryData: YarnProductionSummaryRow[];
  distinctYarnTypes: string[];
}

const YarnSummaryTable: React.FC<YarnSummaryTableProps> = React.memo(({ summaryData, distinctYarnTypes }) => {
  const [showLegend, setShowLegend] = useState<boolean>(true);

  const yarnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    summaryData.forEach(row => {
      Object.entries(row.yarnTypes).forEach(([type, val]) => {
        totals[type] = (totals[type] || 0) + val;
      });
    });
    return totals;
  }, [summaryData]);

  const grandTotal = useMemo(() => Object.values(yarnTotals).reduce((a, b) => a + b, 0), [yarnTotals]);

  const productionWeightedAvgEfficiency = useMemo(() => {
    let weightedSum = 0;
    let prodSum = 0;
    summaryData.forEach(r => {
      if (!isNaN(r.averageEfficiency) && r.totalProductionForDate > 0) {
        weightedSum += r.averageEfficiency * r.totalProductionForDate;
        prodSum += r.totalProductionForDate;
      }
    });
    if (prodSum > 0) return weightedSum / prodSum;
    const valid = summaryData.filter(r => !isNaN(r.averageEfficiency));
    if (!valid.length) return 0;
    return valid.reduce((s, r) => s + r.averageEfficiency, 0) / valid.length;
  }, [summaryData]);

  if (summaryData.length === 0) {
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
    <div className="p-6 pb-6">
      <div className="w-full overflow-x-auto">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto relative">
          <Table className="w-full min-w-full table-fixed">
            <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
              <TableRow className="border-b dark:border-gray-700">
                <TableHead className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[120px] bg-gray-50 dark:bg-gray-800">
                  Date
                </TableHead>
                {distinctYarnTypes.map((yarnType, index) => (
                  <TableHead
                    key={`yarn-type-${yarnType}-${index}`}
                    className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:px-6 dark:text-gray-400 w-[100px] bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className={`inline-block w-2 h-2 mb-1 rounded-full ${getYarnTypeColor(yarnType)}`}></span>
                      <span className="font-semibold">{formatYarnTypeDisplay(yarnType)}</span>
                      <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        CURRENT
                      </span>
                    </div>
                  </TableHead>
                ))}
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
              {summaryData.map((row, index) => (
                <TableRow key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(row.date)}</span>
                    </div>
                  </TableCell>
                  {distinctYarnTypes.map((yarnType, typeIndex) => (
                    <TableCell
                      key={`row-${index}-type-${yarnType}-${typeIndex}`}
                      className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6"
                    >
                      {(() => {
                        const productionValue = row.yarnTypes[yarnType] || 0;
                        const hasValue = productionValue > 0;
                        return (
                          <span
                            className={`${
                              hasValue ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {hasValue ? productionValue.toFixed(2) : '0.00'}
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                          </span>
                        );
                      })()}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {row.totalProductionForDate.toFixed(2)}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300">{row.machineCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-center whitespace-nowrap sm:px-6">
                    <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const efficiency = row.averageEfficiency;
                        const isValidEfficiency = !isNaN(efficiency) && efficiency !== null && efficiency !== undefined;
                        const displayEfficiency = isValidEfficiency ? efficiency : 0;
                        return (
                          <>
                            <div className={`w-3 h-3 rounded-full ${getEfficiencyColorClass(displayEfficiency)}`}></div>
                            <Badge
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(
                                displayEfficiency
                              )}`}
                            >
                              {isValidEfficiency ? displayEfficiency.toFixed(1) : '0.0'}%
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {summaryData.length > 0 && (
        <div className="mt-4 w-full overflow-x-auto">
          <Table className="w-full min-w-full table-fixed">
            <TableBody>
              <TableRow className="bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800">
                <TableCell className="px-4 py-3 font-semibold text-left whitespace-nowrap sm:px-6 text-indigo-700 dark:text-indigo-300">
                  Totals
                </TableCell>
                {distinctYarnTypes.map((yarnType, idx) => (
                  <TableCell
                    key={`outside-total-${yarnType}-${idx}`}
                    className="px-4 py-3 font-semibold text-center whitespace-nowrap sm:px-6"
                  >
                    <span className="text-indigo-700 dark:text-indigo-300">
                      {(yarnTotals[yarnType] || 0).toFixed(2)}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
                    </span>
                  </TableCell>
                ))}
                <TableCell className="px-4 py-3 font-bold text-center whitespace-nowrap sm:px-6 text-indigo-800 dark:text-indigo-200">
                  {grandTotal.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">kg</span>
                </TableCell>
                <TableCell className="px-4 py-3 text-center whitespace-nowrap sm:px-6">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">—</span>
                </TableCell>
                <TableCell
                  className="px-4 py-3 text-center whitespace-nowrap sm:px-6"
                  title="Production-weighted average efficiency across all visible days"
                >
                  <span className="inline-flex items-center gap-1 text-indigo-800 dark:text-indigo-200 font-semibold">
                    {productionWeightedAvgEfficiency.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {showLegend && (
        <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Legend</h4>
            <button
              onClick={() => setShowLegend(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Hide
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Current Machine Yarn Types Only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                CURRENT
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Shows production for current yarn type only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">123.45</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Production amount for current yarn type on this date</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">0.00</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">No production for this yarn type on this date</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              📝 <strong>Note:</strong> This view shows production data mapped to current machine yarn types only. If a machine's
              yarn type was changed, past production data will only be visible if it matches the current yarn type.
            </p>
          </div>
        </div>
      )}
      {!showLegend && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowLegend(true)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Show Legend
          </button>
        </div>
      )}
    </div>
  );
});

export default YarnSummaryTable;
