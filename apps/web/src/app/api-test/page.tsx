"use client";

import { useState, useEffect } from 'react';
import { useBrowserSupabaseClient } from '@/lib/supabase';
import supabaseApi from '@/lib/supabase-api';
import { useAuth } from '@clerk/nextjs';

interface TestResult {
  name: string;
  success: boolean;
}

export default function ApiTest() {
  const supabase = useBrowserSupabaseClient();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});
  const { userId, getToken } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      // Supabase client handles authentication token automatically
    };
    
    fetchToken();
  }, [userId, getToken]);

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

  // Get coach role for testing
  const addCoachRole = async () => {
    setLoading(prev => ({ ...prev, addCoachRole: true }));
    setError(prev => ({ ...prev, addCoachRole: null }));
    
    try {
      console.log(`[Test] Adding coach role for user: ${userId}`);
      const data = await supabaseApi.users.update(supabase, userId!, {
        metadata: { role: 'coach' }
      });
      console.log(`[Test] Coach role added:`, data);
      setResults(prev => ({ ...prev, addCoachRole: data }));
      return data;
    } catch (err) {
      console.error(`[Test] Error in addCoachRole:`, err);
      setError(prev => ({ ...prev, addCoachRole: err }));
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, addCoachRole: false }));
    }
  };

  // Test functions using Supabase edge functions
  const tests = {
    getEvents: () => supabaseApi.events.getAll(supabase),
    getAthletes: () => supabaseApi.athletes.getAll(supabase),
    getDashboardInit: () => supabaseApi.dashboard.getInit(supabase),
    testUserStatus: () => supabaseApi.users.getStatus(supabase),
    getUserProfile: () => supabaseApi.users.getProfile(supabase, userId!),
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

  if (!userId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>You must be signed in to use the API test page. Please sign in first.</p>
        </div>
      </div>
    );
  }

  if (userId && !authToken) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          <p>Loading authentication token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
        <p>Your user ID: {userId}</p>
        <p>Authentication token: {authToken ? 'Available ✓' : 'Not available ✗'}</p>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => runAllTests()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Run All Tests
          </button>
          
          <button
            onClick={addCoachRole}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading.addCoachRole}
          >
            {loading.addCoachRole ? 'Adding Coach Role...' : 'Add Coach Role for Testing'}
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

        {/* Add Coach Role Results */}
        {(results.addCoachRole || error.addCoachRole || loading.addCoachRole) && (
          <div className="border p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Add Coach Role</h2>
            
            {loading.addCoachRole && (
              <div className="text-blue-500">Adding coach role...</div>
            )}
            
            {error.addCoachRole && (
              <div className="text-red-500">
                Error: {error.addCoachRole.message || JSON.stringify(error.addCoachRole)}
              </div>
            )}
            
            {results.addCoachRole && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(results.addCoachRole, null, 2)}
              </pre>
            )}
          </div>
        )}

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