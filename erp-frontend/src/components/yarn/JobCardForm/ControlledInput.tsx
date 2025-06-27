import React from 'react';

interface ControlledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const ControlledInput: React.FC<ControlledInputProps> = ({ label, value, onChange, className = '', ...props }) => (
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${className}`}
      {...props}
    />
  </div>
);

export default ControlledInput;
