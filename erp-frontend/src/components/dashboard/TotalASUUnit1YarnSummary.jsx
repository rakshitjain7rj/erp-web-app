import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../context/AuthContext";

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Add custom styles for animations
const customStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 40px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes slideIn {
    from {
      width: 0%;
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .animate-fadeInUp-delay-1 {
    animation: fadeInUp 0.6s ease-out 0.1s both;
  }
  
  .animate-fadeInUp-delay-2 {
    animation: fadeInUp 0.6s ease-out 0.2s both;
  }
  
  .animate-fadeInUp-delay-3 {
    animation: fadeInUp 0.6s ease-out 0.3s both;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

// Create enhanced custom components
const Progress = ({ value, className, showGradient = true }) => (
  <div className={`w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner relative overflow-hidden`}>
    <div 
      style={{ width: `${value}%` }} 
      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${className} ${
        showGradient ? 'bg-gradient-to-r' : ''
      }`}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
    </div>
  </div>
);

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 rounded ${className}`}></div>
);

const CardDescription = ({ children, className }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-300 ${className || ''}`}>{children}</p>
);

// Add yarn type icon component
const YarnTypeIcon = ({ type }) => {
  const getIcon = (yarnType) => {
    const lowerType = yarnType.toLowerCase();
    if (lowerType.includes('cotton')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    } else if (lowerType.includes('polyester')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    } else if (lowerType.includes('blend')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
    }
  };

  return <span className="text-current">{getIcon(type)}</span>;
};

function TotalASUUnit1YarnSummary({ days = 31, showRefreshButton = false }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yarnTypeBreakdown, setYarnTypeBreakdown] = useState([]);
  const [totalProduction, setTotalProduction] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Date range state (defaults to last `days` days)
  const todayIso = () => new Date().toISOString().split('T')[0];
  const pastDaysIso = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  const startOfMonthIso = () => {
    const d = new Date();
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    return s.toISOString().split('T')[0];
  };
  const [dateFrom, setDateFrom] = useState(pastDaysIso(days));
  const [dateTo, setDateTo] = useState(todayIso());

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use selected date range
      const from = dateFrom || pastDaysIso(days);
      const to = dateTo || todayIso();
      
      // Build the API URL for ASU Unit 1 production entries
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const apiEndpoint = `${baseUrl}/asu-unit1/production-entries`;
      
      console.log(`Fetching ASU Unit 1 production data from ${apiEndpoint} for date range: ${from} to ${to}`);
      
      // Prepare auth headers
      const token = user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch data from the ASU Unit 1 API with a large limit to get all entries
      const response = await axios.get(apiEndpoint, {
        params: {
          dateFrom: from,
          dateTo: to,
          limit: 1000 // Get enough entries to cover the date range
        },
        headers
      });

      // Check if we have valid data
      if (response.data && response.data.success && response.data.data && response.data.data.items) {
        console.log('Received ASU Unit 1 production data:', response.data.data.items);
        // Process the production entries data
        processProductionEntries(response.data.data.items);
      } else {
        throw new Error('Invalid data format received from ASU Unit 1 API');
      }
    } catch (err) {
      console.error('Error fetching ASU Unit 1 production data:', err);
      setError('Failed to fetch ASU Unit 1 production data. Using mock data instead.');
      
      // Generate mock data for development
      const mockData = generateMockData(days);
      processYarnData(mockData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const generateMockData = (days) => {
    const mockData = [];
    // Use more realistic yarn types that would be found in ASU Unit 1
    const yarnTypes = ['Cotton', 'Polyester', 'Cotton/Polyester Blend', 'Viscose', 'Modal', 'Bamboo'];
    
    // Generate data for the past 'days' days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Add 1-3 random yarn types for each day with realistic production amounts
      const typesCount = 1 + Math.floor(Math.random() * 3);
      const shuffledTypes = [...yarnTypes].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < typesCount; j++) {
        mockData.push({
          date: dateString,
          type: shuffledTypes[j],
          quantity: 20 + Math.floor(Math.random() * 150) // 20-170 kg per day per yarn type
        });
      }
    }
    
    return mockData;
  };

  const processProductionEntries = (entries) => {
    try {
      console.log('Processing ASU Unit 1 production entries:', entries);
      
      // Group by yarn type and sum the actual production
      const typeMap = new Map();
      let total = 0;
      
      entries.forEach((entry) => {
        // Get yarn type from entry (prioritize entry's own yarn type, then machine's yarn type)
        const yarnType = entry.yarnType || entry.machine?.yarnType || 'Unknown';
        
        // Use actualProduction field which contains the production for this specific shift
        const actualProduction = parseFloat(entry.actualProduction) || 0;
        
        // Add to yarn type totals
        const currentTotal = typeMap.get(yarnType) || 0;
        typeMap.set(yarnType, currentTotal + actualProduction);
        total += actualProduction;
        
        console.log(`Entry ${entry.id}: ${yarnType} - ${entry.shift} shift: ${actualProduction} kg (Date: ${entry.date})`);
      });
      
      // Convert to array and sort by total (descending)
      const typeBreakdown = Array.from(typeMap.entries())
        .map(([type, total]) => ({ type, total }))
        .sort((a, b) => b.total - a.total);
      
      console.log('Processed yarn breakdown from production entries:', typeBreakdown);
      console.log('Total production:', total);
      
      setYarnTypeBreakdown(typeBreakdown);
      setTotalProduction(total);
      
      // Clear error if we have data
      if (typeBreakdown.length > 0) {
        setError(null);
      } else {
        setError('No ASU Unit 1 production data found for the selected period');
      }
    } catch (err) {
      console.error('Error processing production entries:', err);
      setError('Error processing ASU Unit 1 data. Using mock data instead.');
      
      // Fall back to mock data
      const mockData = generateMockData(days);
      processYarnData(mockData);
    }
  };

  const processApiData = (data) => {
    try {
      // The API returns data grouped by date, each with a yarnBreakdown object
      // We need to aggregate all yarn types across all dates
      
      const typeMap = new Map();
      let total = 0;
      
      data.forEach((dayData) => {
        // Each day has a yarnBreakdown object with yarn types as keys
        const yarnBreakdown = dayData.yarnBreakdown || {};
        
        // Add each yarn type's production to our running totals
        Object.entries(yarnBreakdown).forEach(([type, quantity]) => {
          const currentTotal = typeMap.get(type) || 0;
          const numericQuantity = Number(quantity);
          if (!isNaN(numericQuantity)) {
            typeMap.set(type, currentTotal + numericQuantity);
            total += numericQuantity;
          }
        });
      });
      
      // Convert to array and sort by total (descending)
      const typeBreakdown = Array.from(typeMap.entries())
        .map(([type, total]) => ({ type, total }))
        .sort((a, b) => b.total - a.total);
      
      console.log('Processed yarn breakdown:', typeBreakdown);
      
      setYarnTypeBreakdown(typeBreakdown);
      setTotalProduction(total);
      
      // Clear error if we have data
      if (typeBreakdown.length > 0) {
        setError(null);
      } else {
        setError('No yarn production data found for the selected period');
      }
    } catch (err) {
      console.error('Error processing API data:', err);
      setError('Error processing data. Using mock data instead.');
      
      // Fall back to mock data
      const mockData = generateMockData(days);
      processYarnData(mockData);
    }
  };

  const processYarnData = (data) => {
    // Group and sum by yarn type
    const typeMap = new Map();
    let total = 0;

    data.forEach((item) => {
      const currentTotal = typeMap.get(item.type) || 0;
      typeMap.set(item.type, currentTotal + item.quantity);
      total += item.quantity;
    });

    // Convert to array and sort by total (descending)
    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total);

    setYarnTypeBreakdown(typeBreakdown);
    setTotalProduction(total);
  };

  // Get enhanced colors and gradients based on the yarn type
  const getColorForYarnType = (type) => {
    const lowerType = type.toLowerCase();
    
    // Define color schemes with gradients for different yarn types
    const colorSchemes = {
      cotton: {
        gradient: 'from-green-400 to-green-600',
        bg: 'bg-green-500',
        text: 'text-green-700 dark:text-green-300',
        bgLight: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800'
      },
      polyester: {
        gradient: 'from-blue-400 to-blue-600',
        bg: 'bg-blue-500',
        text: 'text-blue-700 dark:text-blue-300',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800'
      },
      blend: {
        gradient: 'from-purple-400 to-purple-600',
        bg: 'bg-purple-500',
        text: 'text-purple-700 dark:text-purple-300',
        bgLight: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800'
      },
      viscose: {
        gradient: 'from-pink-400 to-pink-600',
        bg: 'bg-pink-500',
        text: 'text-pink-700 dark:text-pink-300',
        bgLight: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800'
      },
      modal: {
        gradient: 'from-indigo-400 to-indigo-600',
        bg: 'bg-indigo-500',
        text: 'text-indigo-700 dark:text-indigo-300',
        bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800'
      },
      bamboo: {
        gradient: 'from-emerald-400 to-emerald-600',
        bg: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-300',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800'
      }
    };

    // Find matching color scheme
    for (const [key, scheme] of Object.entries(colorSchemes)) {
      if (lowerType.includes(key)) {
        return scheme;
      }
    }

    // Default fallback colors
    const defaultColors = [
      {
        gradient: 'from-orange-400 to-orange-600',
        bg: 'bg-orange-500',
        text: 'text-orange-700 dark:text-orange-300',
        bgLight: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800'
      },
      {
        gradient: 'from-teal-400 to-teal-600',
        bg: 'bg-teal-500',
        text: 'text-teal-700 dark:text-teal-300',
        bgLight: 'bg-teal-50 dark:bg-teal-900/20',
        border: 'border-teal-200 dark:border-teal-800'
      },
      {
        gradient: 'from-red-400 to-red-600',
        bg: 'bg-red-500',
        text: 'text-red-700 dark:text-red-300',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
      }
    ];
    
    // Generate a consistent index based on the yarn type name
    const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultColors[hash % defaultColors.length];
  };

  if (loading) {
    return (
      <Card className="w-full border dark:bg-gray-800 dark:border-gray-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="dark:bg-gray-800 border-b dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-bold dark:text-white">ASU Unit 1 Yarn Production (Last {days} Days)</CardTitle>
              <CardDescription>Loading ASU Unit 1 yarn production data...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="dark:bg-gray-800 p-6">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <div className="ml-auto">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && yarnTypeBreakdown.length === 0) {
    return (
      <Card className="w-full border border-red-200 dark:bg-gray-800 dark:border-red-800 shadow-lg">
        <CardHeader className="dark:bg-gray-800 border-b dark:border-gray-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <div>
              <CardTitle className="text-xl font-bold dark:text-white">ASU Unit 1 Yarn Production (Last {days} Days)</CardTitle>
              <CardDescription className="text-red-500 dark:text-red-300">{error}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="dark:text-white dark:bg-gray-800 p-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300">No ASU Unit 1 production data available. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
      
      <Card className="relative w-full border-0 dark:bg-gray-800 dark:border-gray-600 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-3xl opacity-20 animate-pulse transform -translate-x-1/3 translate-y-1/3 animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full blur-3xl opacity-15 animate-pulse transform -translate-x-1/2 -translate-y-1/2 animation-delay-2000"></div>
        </div>
      <CardHeader className="relative z-10 flex flex-col gap-4 pb-6 dark:bg-gray-800/50 border-b-2 dark:border-gray-600/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative p-3 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-xl transform hover:scale-110 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <svg className="relative w-8 h-8 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold dark:text-white bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent drop-shadow-sm">
              ASU Unit 1 Yarn Production
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Total Production:
              </span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                {totalProduction.toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400">kg</span>
              {error && <span className="text-yellow-500 dark:text-yellow-300 ml-2 text-sm">(Using mock data)</span>}
              <div className="ml-auto px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
                🔴 Live Data
              </div>
            </CardDescription>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex items-end gap-3">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">From</div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-44 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 rounded-md px-2 py-1 border"
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">To</div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-44 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 rounded-md px-2 py-1 border"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Apply'}
              </button>
              <button
                onClick={() => { setDateFrom(startOfMonthIso()); setDateTo(todayIso()); setTimeout(fetchData, 0); }}
                className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                This Month
              </button>
            </div>
          </div>
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm border border-white/20 dark:border-gray-600/20"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-500 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 dark:bg-gray-800/50 p-8 backdrop-blur-sm">
        <div className="space-y-8">
          {/* Enhanced Summary Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-105 hover:rotate-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-blue-100 text-sm font-medium">Total Production</span>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-xl">📊</span>
                </div>
              </div>
              <div className="text-3xl font-bold drop-shadow-lg">{totalProduction.toLocaleString()} kg</div>
              <div className="text-blue-200 text-xs mt-1">Last {days} days</div>
            </div>
            
            <div className="group bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-105 hover:rotate-1 transition-all duration-300" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-green-100 text-sm font-medium">Yarn Types</span>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-xl">🧶</span>
                </div>
              </div>
              <div className="text-3xl font-bold drop-shadow-lg">{yarnTypeBreakdown.length}</div>
              <div className="text-green-200 text-xs mt-1">Active types</div>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-105 hover:rotate-1 transition-all duration-300" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-purple-100 text-sm font-medium">Top Producer</span>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-xl">🏆</span>
                </div>
              </div>
              <div className="text-lg font-bold drop-shadow-lg">
                {yarnTypeBreakdown.length > 0 ? 
                  yarnTypeBreakdown.sort((a, b) => b.total - a.total)[0].type : 'N/A'
                }
              </div>
              <div className="text-purple-200 text-xs mt-1">Leading type</div>
            </div>
            
            <div className="group bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl transform hover:scale-105 hover:rotate-1 transition-all duration-300" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-orange-100 text-sm font-medium">Daily Average</span>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <span className="text-xl">⚡</span>
                </div>
              </div>
              <div className="text-2xl font-bold drop-shadow-lg">
                {days > 0 ? Math.round(totalProduction / days) : 0} kg
              </div>
              <div className="text-orange-200 text-xs mt-1">Per day</div>
            </div>
          </div>
          
          {/* Section Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-600"></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-full shadow-lg">
              <span className="text-lg">📈</span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Production Breakdown</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent dark:via-purple-600"></div>
          </div>

          {yarnTypeBreakdown.map((item, index) => {
            const percentage = Math.round((item.total / totalProduction) * 100);
            const colorScheme = getColorForYarnType(item.type);
            
            return (
              <div key={index} className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${colorScheme.bgLight} ${colorScheme.border} group hover:scale-[1.02]`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorScheme.text} transition-transform duration-200 group-hover:scale-110`}>
                      <YarnTypeIcon type={item.type} />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-white text-lg">
                        {item.type}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Yarn Category
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.total.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: colorScheme.text.includes('text-') ? undefined : colorScheme.text }}>
                      {percentage}% of total
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className={`bg-gradient-to-r ${colorScheme.gradient} shadow-sm`}
                    showGradient={true}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow-sm">
                      {percentage > 10 ? `${percentage}%` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Yarn Types</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {yarnTypeBreakdown.length}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Top Producer</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 truncate">
                {yarnTypeBreakdown[0]?.type || 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg/Type</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {yarnTypeBreakdown.length > 0 ? Math.round(totalProduction / yarnTypeBreakdown.length) : 0}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Period</div>
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {days}d
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

export default TotalASUUnit1YarnSummary;
