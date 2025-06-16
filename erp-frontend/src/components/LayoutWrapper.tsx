import React from "react";

const LayoutWrapper = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      {title && (
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 sm:mb-8 text-center sm:text-left">
          {title}
        </h2>
      )}
      {children}
    </main>
  );
};

export default LayoutWrapper;
