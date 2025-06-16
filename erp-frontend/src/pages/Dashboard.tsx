import React from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "../components/LayoutWrapper"; // reusable layout wrapper (see below)

// You can also fetch real data and pass via props if needed
const Dashboard = () => {
  const stats = [
    {
      title: "Total Inventory Items",
      value: 120,
      color: "text-blue-600",
    },
    {
      title: "Active Work Orders",
      value: 8,
      color: "text-green-600",
    },
    {
      title: "Pending BOMs",
      value: 5,
      color: "text-yellow-500",
    },
  ];

  return (
    <LayoutWrapper title="Dashboard Overview">
      <section
        aria-label="Dashboard Summary Cards"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        {stats.map((item) => (
          <motion.article
            key={item.title}
            className="bg-white rounded-2xl shadow-md p-5 sm:p-6 hover:shadow-xl transition"
            whileHover={{ scale: 1.03 }}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700">{item.title}</h3>
            <p className={`text-2xl sm:text-3xl font-bold mt-2 ${item.color}`}>
              {item.value}
            </p>
          </motion.article>
        ))}
      </section>
    </LayoutWrapper>
  );
};

export default Dashboard;
