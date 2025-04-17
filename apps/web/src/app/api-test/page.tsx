"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useBrowserSupabaseClient } from '@/lib/supabase';

interface TestResult {
  name: string;
  success: boolean;
}

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});
  const { userId, getToken } = useAuth();
  const supabase = useBrowserSupabaseClient();
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      if (userId) {
        try {
          // Get a session token specifically for API access
          const token = await getToken({ template: "supabase" });
          setAuthToken(token);
          console.log("Auth token fetched successfully");
        } catch (err) {
          console.error("Error fetching auth token:", err);
        }
      }
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

  // Modified fetchWithAuth helper to ensure all API calls include auth
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // Determine function name by using the full path after '/api'
    const fnName = url.startsWith('/api/') ? `api${url}` : url;
    // Normalize method to Supabase HttpMethod union
    const method = (options.method?.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') ?? 'GET';
    const { data: rawData, error } = await supabase.functions.invoke(fnName, {
      method,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });
    if (error) throw error;
    return JSON.parse(rawData);
  };

  // Define key API tests
  const tests = {
    getEvents: async () => fetchWithAuth('/api/events'),
    getAthletes: async () => fetchWithAuth('/api/athletes'),
    getDashboardInit: async () => fetchWithAuth('/api/dashboard/exercisesInit'),
    getDashboardWeekly: async () => fetchWithAuth('/api/dashboard/weeklyOverview'),
    getDashboardMesocycle: async () => fetchWithAuth('/api/dashboard/mesocycle'),
    getDashboardExercises: async () => fetchWithAuth('/api/dashboard/exercises'),
    createTrainingSession: async () => fetchWithAuth('/api/dashboard/trainingSession', {
      method: 'POST',
      body: JSON.stringify({ exercise_training_session_id: 1, exercisesDetail: [] })
    }),
    updateTrainingSession: async () => fetchWithAuth('/api/dashboard/trainingSession', {
      method: 'PUT',
      body: JSON.stringify({ exercise_training_session_id: 1, exercisesDetail: [], status: 'completed' })
    }),
    getPlannerExercises: async () => fetchWithAuth('/api/planner/exercises'),
    createMicrocycle: async () => fetchWithAuth('/api/planner/microcycle', {
      method: 'POST',
      body: JSON.stringify({ microcycle: { name: 'Test', description: 'Test', start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now()+6*24*60*60*1000).toISOString().split('T')[0] }, sessions: [] })
    }),
    createMesocycle: async () => fetchWithAuth('/api/planner/mesocycle', {
      method: 'POST',
      body: JSON.stringify({ sessions: [], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    }),
    testUserStatus: async () => fetchWithAuth('/api/user-status'),
    getUserProfile: async () => fetchWithAuth(`/api/users/${userId}/profile`),
    updateUser: async () => fetchWithAuth(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ metadata: {} })
    }),
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