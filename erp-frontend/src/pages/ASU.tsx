// src/pages/ASU.tsx

import React, { useState } from 'react';
import ASUUnit from './ASUUnit';

const ASU: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'unit1' | 'unit2'>('unit1');

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-100 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex mb-6 space-x-4">
          <button
            onClick={() => setActiveTab('unit1')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'unit1'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            ASU Unit 1
          </button>
          <button
            onClick={() => setActiveTab('unit2')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'unit2'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            ASU Unit 2
          </button>
        </div>

        {activeTab === 'unit1' && <ASUUnit unit={1} />}
        {activeTab === 'unit2' && <ASUUnit unit={2} />}
      </div>
    </div>
  );
};

export default ASU;
