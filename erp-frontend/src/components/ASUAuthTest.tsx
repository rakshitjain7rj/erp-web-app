// src/components/ASUAuthTest.tsx
// Simple component to test ASU Unit 1 API authentication

import React, { useState } from 'react';
import { asuUnit1Api } from '../api/asuUnit1Api';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TestResults {
  tokenTest?: any;
  machinesTest?: any;
  statsTest?: any;
}

const ASUAuthTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(false);

  const testToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { status: 'No token found', hasToken: false };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < currentTime;
      
      return {
        status: isExpired ? 'Token expired' : 'Token valid',
        hasToken: true,
        isExpired,
        payload: payload,
        expiresAt: new Date(payload.exp * 1000).toLocaleString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'Invalid token format', hasToken: true, error: errorMessage };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const results: TestResults = {};

    // Test 1: Check token
    results.tokenTest = testToken();

    // Test 2: Test machines endpoint
    try {
      const machines = await asuUnit1Api.getMachines();
      results.machinesTest = { 
        status: 'Success', 
        data: machines.slice(0, 2), // Show first 2 machines
        count: machines.length 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.machinesTest = { 
        status: 'Failed', 
        error: errorMessage,
        responseStatus: (error as any).response?.status,
        responseData: (error as any).response?.data
      };
    }

    // Test 3: Test stats endpoint
    try {
      const stats = await asuUnit1Api.getProductionStats();
      results.statsTest = { status: 'Success', data: stats };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.statsTest = { 
        status: 'Failed', 
        error: errorMessage,
        responseStatus: (error as any).response?.status
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>ASU Unit 1 API Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run Authentication Tests'}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {/* Token Test */}
            <div className="p-4 border rounded">
              <h4 className="font-medium">Token Test:</h4>
              <pre className="text-sm bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.tokenTest, null, 2)}
              </pre>
            </div>

            {/* Machines Test */}
            <div className="p-4 border rounded">
              <h4 className="font-medium">GET /machines Test:</h4>
              <pre className="text-sm bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.machinesTest, null, 2)}
              </pre>
            </div>

            {/* Stats Test */}
            <div className="p-4 border rounded">
              <h4 className="font-medium">GET /stats Test:</h4>
              <pre className="text-sm bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.statsTest, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 mt-4">
          <p><strong>How to fix 401 errors:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure you're logged in and have a valid token</li>
            <li>Check if your token has expired</li>
            <li>Verify the backend server is running on port 5000</li>
            <li>Ensure the database migration has been run</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ASUAuthTest;
