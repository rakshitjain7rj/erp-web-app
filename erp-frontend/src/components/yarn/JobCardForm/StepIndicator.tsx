import React from 'react';

interface Step {
  id: number;
  title: string;
  icon?: React.ElementType;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <div className="flex justify-between mt-6">
    {steps.map((step) => (
      <div
        key={step.id}
        className={`flex items-center space-x-2 ${
          currentStep >= step.id ? 'text-white' : 'text-blue-200 dark:text-blue-300'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step.id ? 'bg-white text-blue-600 dark:bg-gray-100 dark:text-blue-700' : 'bg-blue-500 dark:bg-blue-600'
          }`}
        >
          {currentStep > step.id ? '✓' : step.id}
        </div>
        <span className="hidden text-sm font-medium sm:block">{step.title}</span>
      </div>
    ))}
  </div>
);

export default StepIndicator;
