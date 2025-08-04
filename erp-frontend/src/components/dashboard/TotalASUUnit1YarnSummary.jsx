import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../context/AuthContext";

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create simple custom components
const Progress = ({ value, className }) => (
  <div className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
    <div style={{ width: `${value}%` }} className={`h-full rounded opacity-90 dark:opacity-100 ${className}`}></div>
  </div>
);

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-500 rounded ${className}`}></div>
);

const CardDescription = ({ children, className }) => (
  <p className={`text-sm text-gray-500 dark:text-white ${className || ''}`}>{children}</p>
);

function TotalASUUnit1YarnSummary({ days = 31, showRefreshButton = false }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yarnTypeBreakdown, setYarnTypeBreakdown] = useState([]);
  const [totalProduction, setTotalProduction] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range for the last 'days' days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Format dates for API
      const dateFrom = startDate.toISOString().split('T')[0];
      const dateTo = endDate.toISOString().split('T')[0];
      
      // Build the API URL correctly
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const apiEndpoint = `${baseUrl}/yarn/production-entries`;
      
      console.log(`Fetching yarn production data from ${apiEndpoint} for date range: ${dateFrom} to ${dateTo}`);
      
      // Prepare auth headers
      const token = user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch data from the API
      const response = await axios.get(apiEndpoint, {
        params: {
          dateFrom,
          dateTo
        },
        headers
      });

      // Check if we have valid data
      if (response.data && response.data.success && response.data.data) {
        console.log('Received yarn production data:', response.data.data);
        // Process the data
        processApiData(response.data.data);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching yarn production data:', err);
      setError('Failed to fetch production data. Using mock data instead.');
      
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
  }, [days]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const generateMockData = (days) => {
    const mockData = [];
    const yarnTypes = ['Cotton 30s', 'Cotton 40s', 'Polyester 30s', 'Blend 30s', 'Viscose 40s', 'Organic Cotton 30s'];
    
    // Generate data for the past 'days' days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Add 2-3 random yarn types for each day
      const typesCount = 2 + Math.floor(Math.random() * 2);
      const shuffledTypes = [...yarnTypes].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < typesCount; j++) {
        mockData.push({
          date: dateString,
          type: shuffledTypes[j],
          quantity: 100 + Math.floor(Math.random() * 900)
        });
      }
    }
    
    return mockData;
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

  // Get a color based on the yarn type
  const getColorForYarnType = (type) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-300', 
      'bg-green-500 dark:bg-green-300', 
      'bg-yellow-500 dark:bg-yellow-300', 
      'bg-red-500 dark:bg-red-300', 
      'bg-purple-500 dark:bg-purple-300', 
      'bg-pink-500 dark:bg-pink-300',
      'bg-indigo-500 dark:bg-indigo-300', 
      'bg-teal-500 dark:bg-teal-300', 
      'bg-orange-500 dark:bg-orange-300'
    ];
    
    // Generate a consistent index based on the yarn type name
    const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <Card className="w-full border dark:bg-gray-800 dark:border-gray-600 shadow-md">
        <CardHeader className="dark:bg-gray-800 border-b dark:border-gray-600">
          <CardTitle className="text-xl font-bold dark:text-white">Yarn Category Production (Last {days} Days)</CardTitle>
          <CardDescription>Loading yarn production data...</CardDescription>
        </CardHeader>
        <CardContent className="dark:bg-gray-800">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && yarnTypeBreakdown.length === 0) {
    return (
      <Card className="w-full border dark:bg-gray-800 dark:border-gray-600 shadow-md">
        <CardHeader className="dark:bg-gray-800 border-b dark:border-gray-600">
          <CardTitle className="text-xl font-bold dark:text-white">Yarn Category Production (Last {days} Days)</CardTitle>
          <CardDescription className="text-red-500 dark:text-red-300">{error}</CardDescription>
        </CardHeader>
        <CardContent className="dark:text-white dark:bg-gray-800">
          <p>No data available. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border dark:bg-gray-800 dark:border-gray-600 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 dark:bg-gray-800 border-b dark:border-gray-600">
        <div>
          <CardTitle className="text-xl font-bold dark:text-white">Yarn Category Production (Last {days} Days)</CardTitle>
          <CardDescription>
            Total Production: <span className="font-medium dark:text-white">{totalProduction.toLocaleString()}</span> kg
            {error && <span className="text-yellow-500 dark:text-yellow-300 ml-2 text-sm">(Using mock data)</span>}
          </CardDescription>
        </div>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-300' : 'text-gray-500 dark:text-gray-300'}`}
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
      </CardHeader>
      <CardContent className="dark:bg-gray-800">
        <div className="space-y-5">
          {yarnTypeBreakdown.map((item, index) => {
            const percentage = Math.round((item.total / totalProduction) * 100);
            const colorClass = getColorForYarnType(item.type);
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-white">{item.type}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-200">
                    {item.total.toLocaleString()} kg ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className={`h-2.5 ${colorClass}`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default TotalASUUnit1YarnSummary;
