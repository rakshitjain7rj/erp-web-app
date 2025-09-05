// src/pages/ASUUnit2Page.tsx
// Temporary Unit2 page reusing Unit1 components. If/when Unit2 diverges (extra fields, different endpoints),
// we will parameterize the shared components to accept a unit key / config object.

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Package, Settings, Gauge } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { ASU_UNITS } from '../config/asuUnits';
import { asuUnit2Api } from '../api/asuUnit2Api';

// Use Unit 2 components
import DailyProductionUnit2 from '../components/asuUnit2/DailyProductionUnit2';
import YarnSummaryUnit2 from '../components/asuUnit2/YarnSummaryUnit2';
import MachineManagerUnit2 from '../components/asuUnit2/MachineManagerUnit2';
import DashboardUnit2 from '../components/asuUnit2/DashboardUnit2';

// NOTE: If later we add Unit2-specific fields (e.g. mains readings, worker name),
// convert these components into generic versions (e.g. /components/asuShared/) and
// pass a config prop: { unit: 'unit2', hasMains: true, hasWorkerName: true, apiBase: '...' }

const ASUUnit2Page: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = (searchParams.get('tab') || '').toLowerCase();
  const initialTab = (['dashboard', 'production', 'summary', 'machines'] as const).includes(
    initialTabParam as any
  )
    ? (initialTabParam as 'dashboard' | 'production' | 'summary' | 'machines')
    : 'production';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'summary' | 'machines'>(initialTab);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            setActiveTab('dashboard');
            break;
          case '2':
            setActiveTab('production');
            break;
          case '3':
            setActiveTab('summary');
            break;
          case '4':
            setActiveTab('machines');
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep URL in sync with selected tab for deep-linking/shareable links
  useEffect(() => {
    const current = (searchParams.get('tab') || '').toLowerCase();
    if (current !== activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Using config: {ASU_UNITS.unit2.productionEndpoint} */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ASU Unit 2 Management</h1>
        <div className="flex space-x-1">
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
            <Badge variant="outline" className="ml-1 text-xs py-0">
              Entry
            </Badge>
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
  {activeTab === 'dashboard' && <DashboardUnit2 />}
  {activeTab === 'production' && <DailyProductionUnit2 />}
        {activeTab === 'summary' && <YarnSummaryUnit2 />}
        {activeTab === 'machines' && <MachineManagerUnit2 />}
      </div>
    </div>
  );
};

export default ASUUnit2Page;
