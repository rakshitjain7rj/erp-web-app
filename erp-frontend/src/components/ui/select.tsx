// src/components/ui/select.tsx
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
}

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export const Select: React.FC<SelectProps> = ({ children, onValueChange, value, defaultValue }) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [open, setOpen] = useState(false);
  
  // Update internal value when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      type="button"
      onClick={() => context.setOpen(!context.open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({ placeholder, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  return (
    <span className={cn('block truncate dark:text-gray-200', className)}>
      {context.value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  if (!context.open) return null;

  return (
    <div className={cn(
      'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 py-1 text-base shadow-lg focus:outline-none sm:text-sm',
      className
    )}>
      {children}
    </div>
  );
};

export const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        'relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-600',
        context.value === value && 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
        className
      )}
    >
      {children}
      {context.value === value && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </button>
  );
};
