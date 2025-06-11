import React from "react";

const Reports = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-gray-700">Download daily, monthly or custom reports related to inventory, work orders, or costing.</p>
        <div className="mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2">
            Download Inventory Report
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Download Costing Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
