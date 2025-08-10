// src/pages/ASUUnit2Page.tsx
// Temporary Unit2 page reusing Unit1 components. If/when Unit2 diverges (extra fields, different endpoints),
// we will parameterize the shared components to accept a unit key / config object.

import React, { useState, useEffect } from 'react';
import { Activity, Package, Settings } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { ASU_UNITS } from '../config/asuUnits';
import { asuUnit2Api } from '../api/asuUnit2Api';

// Use Unit 2 components
import DailyProductionUnit2 from '../components/asuUnit2/DailyProductionUnit2';
import YarnSummaryUnit2 from '../components/asuUnit2/YarnSummaryUnit2';
import MachineManagerUnit2 from '../components/asuUnit2/MachineManagerUnit2';

// NOTE: If later we add Unit2-specific fields (e.g. mains readings, worker name),
// convert these components into generic versions (e.g. /components/asuShared/) and
// pass a config prop: { unit: 'unit2', hasMains: true, hasWorkerName: true, apiBase: '...' }

const ASUUnit2Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | 'summary' | 'machines'>('production');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            setActiveTab('production');
            break;
          case '2':
            setActiveTab('summary');
            break;
          case '3':
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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Using config: {ASU_UNITS.unit2.productionEndpoint} */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ASU Unit 2 Management</h1>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('production')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'production'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Daily Production (Ctrl+1)"
          >
            <Activity size={18} />
            <span>Daily Production</span>
            <Badge variant="outline" className="ml-1 text-xs py-0">
              Entry
            </Badge>
            <span className="ml-2 text-xs opacity-70">(Ctrl+1)</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Yarn Summary (Ctrl+2)"
          >
            <Package size={18} />
            <span>Yarn Summary</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+2)</span>
          </button>
          <button
            onClick={() => setActiveTab('machines')}
            className={`px-3 py-2 flex items-center space-x-1 rounded transition-colors ${
              activeTab === 'machines'
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
            title="Machine Manager (Ctrl+3)"
          >
            <Settings size={18} />
            <span>Machine Manager</span>
            <span className="ml-2 text-xs opacity-70">(Ctrl+3)</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeTab === 'production' && <DailyProductionUnit2 />}
        {activeTab === 'summary' && <YarnSummaryUnit2 />}
        {activeTab === 'machines' && <MachineManagerUnit2 />}
      </div>
    </div>
  );
};

export default ASUUnit2Page;
