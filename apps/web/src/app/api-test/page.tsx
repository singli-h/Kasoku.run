"use client";

import { useState } from 'react';
import { edgeFunctions } from '@/lib/edge-functions';

interface TestResult {
  name: string;
  success: boolean;
}

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});

  // Helper function to run a test
  const runTest = async (name: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setError(prev => ({ ...prev, [name]: null }));
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [name]: result }));
      console.log(`${name} test result:`, result);
      return true;
    } catch (err) {
      console.error(`${name} test error:`, err);
      setError(prev => ({ ...prev, [name]: err }));
      return false;
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  // Test functions
  const tests = {
    getEvents: async () => {
      const data = await edgeFunctions.events.getAll();
      return data;
    },

    getAthletes: async () => {
      const data = await edgeFunctions.athletes.getAll();
      return data;
    },

    getDashboardInit: async () => {
      const data = await edgeFunctions.dashboard.getExercisesInit();
      return data;
    },

    testUserStatus: async () => {
      const response = await fetch('/api/user-status');
      const data = await response.json();
      return data;
    }
  };

  // Run all tests
  const runAllTests = async () => {
    const results: TestResult[] = [];
    for (const [name, test] of Object.entries(tests)) {
      const success = await runTest(name, test);
      results.push({ name, success });
    }
    return results;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => runAllTests()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Run All Tests
          </button>
          
          {Object.keys(tests).map(testName => (
            <button
              key={testName}
              onClick={() => runTest(testName, tests[testName])}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Test {testName}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {Object.keys(tests).map(testName => (
            <div key={testName} className="border p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">{testName}</h2>
              
              {loading[testName] && (
                <div className="text-blue-500">Testing...</div>
              )}
              
              {error[testName] && (
                <div className="text-red-500">
                  Error: {error[testName].message || JSON.stringify(error[testName])}
                </div>
              )}
              
              {results[testName] && (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(results[testName], null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 