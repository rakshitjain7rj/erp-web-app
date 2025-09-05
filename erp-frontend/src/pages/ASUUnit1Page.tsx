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
    <div className="w-full px-4 md:px-6 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ASU Unit 1 Management</h1>
        <div className="flex space-x-1">
          {/** Shared tab styles to ensure consistent visibility in light & dark modes */}
          {(() => {
            const base =
              'px-3 py-2 flex items-center space-x-1 rounded transition-colors ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
            const active =
              'bg-white text-black ring-primary-700 hover:bg-gray-50 dark:bg-black dark:text-gray-200 dark:ring-primary-400 dark:hover:bg-black';
            const inactive =
              'bg-gray-100 text-gray-800 hover:bg-gray-200 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:ring-gray-700';
            return (
              <>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${base} ${activeTab === 'dashboard' ? active : inactive}`}
            title="Dashboard (Ctrl+1)"
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            <Gauge size={18} />
            <span>Dashboard</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+1)</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`${base} ${activeTab === 'production' ? active : inactive}`}
            title="Daily Production (Ctrl+2)"
            aria-current={activeTab === 'production' ? 'page' : undefined}
          >
            <Activity size={18} />
            <span>Daily Production</span>
            <Badge variant="outline" className="ml-1 text-xs py-0">Entry</Badge>
            <span className="ml-2 text-xs opacity-70">(Ctrl+2)</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`${base} ${activeTab === 'summary' ? active : inactive}`}
            title="Yarn Summary (Ctrl+3)"
            aria-current={activeTab === 'summary' ? 'page' : undefined}
          >
            <Package size={18} />
            <span>Yarn Summary</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+3)</span>
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`${base} ${activeTab === 'machines' ? active : inactive}`}
            title="Machine Manager (Ctrl+4)"
            aria-current={activeTab === 'machines' ? 'page' : undefined}
          >
            <Settings size={18} />
            <span>Machine Manager</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+4)</span>
          </button>
              </>
            );
          })()}
        </div>
      </div>

  <div className="bg-white/90 dark:bg-gray-900/60 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="w-full">
              <TotalASUUnit1YarnSummary days={31} showRefreshButton={true} />
            </div>
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
