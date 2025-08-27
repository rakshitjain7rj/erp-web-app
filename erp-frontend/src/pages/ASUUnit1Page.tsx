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
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ASU Unit 1 Management</h1>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Dashboard (Ctrl+1)"
          >
            <Gauge size={18} />
            <span>Dashboard</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+1)</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'production'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Daily Production (Ctrl+2)"
          >
            <Activity size={18} />
            <span>Daily Production</span>
            <Badge variant="outline" className="ml-1 text-xs py-0">Entry</Badge>
            <span className="ml-2 text-xs opacity-70">(Ctrl+2)</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Yarn Summary (Ctrl+3)"
          >
            <Package size={18} />
            <span>Yarn Summary</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+3)</span>
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'machines'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Machine Manager (Ctrl+4)"
          >
            <Settings size={18} />
            <span>Machine Manager</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+4)</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
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
