import React from 'react';

interface StepFooterProps {
  currentStep: number;
  stepsLength: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const StepFooter: React.FC<StepFooterProps> = ({ currentStep, stepsLength, onPrev, onNext, onSave, onCancel }) => (
  <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex space-x-3">
      {currentStep > 1 && (
        <button
          onClick={onPrev}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Previous
        </button>
      )}
    </div>
    <div className="flex space-x-3">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
      >
        Cancel
      </button>
      {currentStep < stepsLength ? (
        <button
          onClick={onNext}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Next
        </button>
      ) : (
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
        >
          Save Job Card
        </button>
      )}
    </div>
  </div>
);

export default StepFooter;
