import React from 'react';
import YarnProductionSummary from '../YarnProductionSummary';

const YarnSummary: React.FC = () => {
  // Simplified component that only renders the YarnProductionSummary

  return (
    <div className="space-y-6">
      {/* Original Yarn Production Summary */}
      <YarnProductionSummary />
    </div>
  );
};

export default YarnSummary;
