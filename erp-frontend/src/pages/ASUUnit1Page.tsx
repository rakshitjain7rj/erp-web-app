// Simplified ASU Unit 1 page restored after merge conflicts.
// Mirrors the structure of ASUUnit2Page with tabbed navigation and
// delegates all logic to existing modular components.

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Package, Settings, Gauge } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import DailyProduction from '../components/asuUnit1/DailyProduction';
import YarnSummary from '../components/asuUnit1/YarnSummary';
import MachineManager from '../components/asuUnit1/MachineManager';
import TotalASUUnit1YarnSummary from '../components/dashboard/TotalASUUnit1YarnSummary';

const ASUUnit1Page: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = (searchParams.get('tab') || '').toLowerCase();
  const initialTab = (['dashboard', 'production', 'summary', 'machines'] as const).includes(initialTabParam as any)
    ? (initialTabParam as 'dashboard' | 'production' | 'summary' | 'machines')
    : 'production';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'summary' | 'machines'>(initialTab);

  // Keyboard shortcuts (Ctrl+1..4)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      switch (e.key) {
        case '1': setActiveTab('dashboard'); break;
        case '2': setActiveTab('production'); break;
        case '3': setActiveTab('summary'); break;
        case '4': setActiveTab('machines'); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sync URL param for deep-linking
  useEffect(() => {
    const current = (searchParams.get('tab') || '').toLowerCase();
    if (current !== activeTab) setSearchParams({ tab: activeTab });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ASU Unit 1</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage production, yarn summary, and machines</p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(() => {
            const base =
              'px-4 py-2 flex items-center space-x-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
            const active =
              'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400';
            const inactive =
              'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50';
            return (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${base} ${activeTab === 'dashboard' ? active : inactive}`}
                  title="Dashboard (Ctrl+1)"
                >
                  <Gauge size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('production')}
                  className={`${base} ${activeTab === 'production' ? active : inactive}`}
                  title="Daily Production (Ctrl+2)"
                >
                  <Activity size={16} />
                  <span>Production</span>
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`${base} ${activeTab === 'summary' ? active : inactive}`}
                  title="Yarn Summary (Ctrl+3)"
                >
                  <Package size={16} />
                  <span>Summary</span>
                </button>
                <button
                  onClick={() => setActiveTab('machines')}
                  className={`${base} ${activeTab === 'machines' ? active : inactive}`}
                  title="Machine Manager (Ctrl+4)"
                >
                  <Settings size={16} />
                  <span>Machines</span>
                </button>
              </>
            );
          })()}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'dashboard' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <TotalASUUnit1YarnSummary days={31} showRefreshButton={true} />
          </div>
        )}
        {activeTab === 'production' && <DailyProduction />}
        {activeTab === 'summary' && <YarnSummary />}
        {activeTab === 'machines' && <MachineManager />}
      </div>
    </div>
  );
};

export default ASUUnit1Page;
