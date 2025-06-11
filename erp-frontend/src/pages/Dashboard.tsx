import React from "react";

const Dashboard = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Total Inventory Items</h3>
          <p className="text-2xl text-blue-500 mt-2">120</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Active Work Orders</h3>
          <p className="text-2xl text-green-500 mt-2">8</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Pending BOMs</h3>
          <p className="text-2xl text-yellow-500 mt-2">5</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
