// src/components/ui/input.tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
  'flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-900/70 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  );
};
