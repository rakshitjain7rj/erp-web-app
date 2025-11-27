import React from 'react';
import { Calendar } from 'lucide-react';
import { TableCell, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { formatDate, getEfficiencyBadgeClass, getEfficiencyColorClass } from './utils';

interface SummaryTableRowProps {
  row: {
    date: string;
    yarnTypes: { [key: string]: number };
    totalProductionForDate: number;
    machineCount: number;
    averageEfficiency: number;
  };
  distinctYarnTypes: string[];
}

const SummaryTableRow: React.FC<SummaryTableRowProps> = ({ row, distinctYarnTypes }) => {
  return (
    <TableRow className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
      <TableCell className="px-4 py-4 whitespace-nowrap sm:px-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatDate(row.date)}
          </span>
        </div>
      </TableCell>
      {distinctYarnTypes.map((yarnType) => {
        const productionValue = row.yarnTypes[yarnType] || 0;
        const hasValue = productionValue > 0;
        return (
          <TableCell
            key={`${row.date}-${yarnType}`}
            className="px-4 py-4 font-medium text-center whitespace-nowrap sm:px-6"
          >
            <span
              className={`${hasValue ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {hasValue ? productionValue.toFixed(2) : '0.00'}
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">kg</span>
            </span>
          </TableCell>
        );
      })}
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
                <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyBadgeClass(displayEfficiency)}`}>
                  {isValidEfficiency ? displayEfficiency.toFixed(1) : '0.0'}%
                </Badge>
              </>
            );
          })()}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(SummaryTableRow);
