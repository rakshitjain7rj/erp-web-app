// src/components/LayoutWrapper.tsx

import React from "react";

interface LayoutWrapperProps {
  title?: string;
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ title, children }) => {
  return (
    <div className="min-h-full text-gray-900 dark:text-white transition-colors duration-300">
      {title && (
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h1>
      )}
      <div>{children}</div>
    </div>
  );
};

export default LayoutWrapper;
