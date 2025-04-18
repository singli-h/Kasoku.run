"use client";

import { useState, useEffect } from 'react';
import { edgeFunctions } from '@/lib/edge-functions';
import { useAuth } from '@clerk/nextjs';

interface TestResult {
  name: string;
  success: boolean;
}

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});
  const { userId, getToken } = useAuth();
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

  // Get coach role for testing
  const addCoachRole = async () => {
    setLoading(prev => ({ ...prev, addCoachRole: true }));
    setError(prev => ({ ...prev, addCoachRole: null }));
    
    try {
      console.log(`[Test] Adding coach role for user: ${userId}`);
      const response = await fetch(`/api-test/add-coach-role?clerk_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Test] Error adding coach role:`, errorText);
        throw new Error(`Failed to add coach role: ${errorText}`);
      }
      
      const data = await response.json();
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

  // Modified fetchWithAuth helper to ensure all API calls include auth
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // Remove leading '/api/' to avoid duplicate 'api' in the path
    const trimmed = url.replace(/^\/api\//, '');
    
    // Invoke the Edge Function with function name 'api' and path parameter
    // Normalize method to Supabase HttpMethod union
    const method = (options.method?.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') ?? 'GET';
    const { data: rawData, error } = await edgeFunctions.invoke('api', {
      method,
      body: options.body ? JSON.parse(options.body as string) : undefined,
      // Pass the endpoint path as query parameter to avoid URL path issues
      queryParams: { path: trimmed }
    });
    if (error) throw error;
    return JSON.parse(rawData);
  };

  // Test functions
  const tests = {
    getEvents: async () => {
      return fetchWithAuth('/api/events');
    },

    getAthletes: async () => {
      return fetchWithAuth('/api/athletes');
    },

    getDashboardInit: async () => {
      return fetchWithAuth('/api/dashboard/exercisesInit');
    },

    testUserStatus: async () => {
      const response = await fetch('/api/user-status', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      return response.json();
    },
    
    getUserProfile: async () => {
      console.log(`[Test] Fetching user profile for userId: ${userId}`);
      return fetchWithAuth(`/api/users/${userId}/profile`);
    },
    
    createMicrocycle: async () => {
      console.log(`[Test] Creating microcycle for userId: ${userId}`);
      
      // First, ensure the user has a coach role
      let hasCoachRole = false;
      
      try {
        const profileResponse = await fetchWithAuth(`/api/users/${userId}/profile`);
        console.log(`[Test] User profile data for coach check:`, profileResponse);
        
        if (profileResponse?.data?.user?.metadata?.role !== 'coach') {
          console.warn(`[Test] User does not have coach role. Current role: ${profileResponse?.data?.user?.metadata?.role}`);
          console.log(`[Test] Attempting to add coach role first...`);
          
          // Add coach role
          const coachRoleResult = await addCoachRole();
          
          if (coachRoleResult?.success) {
            hasCoachRole = true;
            console.log(`[Test] Coach role added successfully.`);
          } else {
            console.error(`[Test] Failed to add coach role:`, coachRoleResult);
            throw new Error("Failed to add coach role required for this test");
          }
        } else {
          hasCoachRole = true;
          console.log(`[Test] User already has coach role.`);
        }
      } catch (err) {
        console.error(`[Test] Error while checking/setting up coach role:`, err);
        throw err;
      }
      
      // Sample minimal data for testing
      const testData = {
        microcycle: {
          name: "Test Microcycle",
          description: "Test description",
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        },
        sessions: [
          {
            name: "Test Session 1",
            description: "Test session description",
            date: new Date().toISOString().split('T')[0],
            exercises: [
              {
                exerciseId: 43, // Barbell Back Squat
                sets: 3,
                reps: 5,
                weight: 100,
                notes: "Test exercise",
                presetDetails: [
                  {
                    setNumber: 1,
                    reps: 5,
                    resistance: 100,
                    resistanceUnitId: 1
                  }
                ]
              }
            ]
          }
        ]
      };
      
      console.log(`[Test] Microcycle test data:`, JSON.stringify(testData, null, 2));
      
      // Now try to create the microcycle using the direct fetch with auth
      return fetchWithAuth('/api/planner/microcycle', {
        method: 'POST',
        body: JSON.stringify(testData)
      });
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