"use client";

import { useState } from 'react';
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
  const { userId } = useAuth();

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
      const response = await fetch(`/api-test/add-coach-role?clerk_id=${userId}`);
      
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
    },
    
    getUserProfile: async () => {
      console.log(`[Test] Fetching user profile for userId: ${userId}`);
      try {
        const data = await edgeFunctions.users.getProfile(userId);
        console.log(`[Test] User profile data:`, data);
        return data;
      } catch (err) {
        console.error(`[Test] Error fetching user profile:`, err);
        throw err;
      }
    },
    
    createMicrocycle: async () => {
      console.log(`[Test] Creating microcycle for userId: ${userId}`);
      
      // First, ensure the user has a coach role
      let hasCoachRole = false;
      let coachId = null;
      
      try {
        const profileResponse = await edgeFunctions.users.getProfile(userId);
        console.log(`[Test] User profile data for coach check:`, profileResponse);
        
        if (profileResponse?.data?.user?.metadata?.role !== 'coach') {
          console.warn(`[Test] User does not have coach role. Current role: ${profileResponse?.data?.user?.metadata?.role}`);
          console.log(`[Test] Attempting to add coach role first...`);
          
          // Add coach role
          const coachRoleResult = await addCoachRole();
          
          if (coachRoleResult?.success) {
            hasCoachRole = true;
            coachId = coachRoleResult.coach?.id;
            console.log(`[Test] Coach role added successfully. Coach ID: ${coachId}`);
          } else {
            console.error(`[Test] Failed to add coach role:`, coachRoleResult);
            throw new Error("Failed to add coach role required for this test");
          }
        } else {
          hasCoachRole = true;
          coachId = profileResponse?.data?.roleSpecificData?.id;
          console.log(`[Test] User already has coach role. Coach ID: ${coachId}`);
        }
        
        if (!coachId) {
          console.error(`[Test] Coach record not found in user profile:`, profileResponse?.data?.roleSpecificData);
          throw new Error("User has coach role but no coach record was found");
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
            group: {
              week: 1,
              day: 1,
              date: new Date().toISOString().split('T')[0],
              name: "Test Session 1",
              description: "Test session description"
            },
            presets: [
              {
                preset: {
                  exercise_id: 43, // Barbell Back Squat
                  superset_id: null,
                  preset_order: 1
                },
                details: [
                  {
                    set_index: 1,
                    reps: 5,
                    weight: 100,
                    metadata: {
                      rpe: 7,
                      exercise_name: "Barbell Back Squat"
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
      
      console.log(`[Test] Microcycle test data:`, JSON.stringify(testData, null, 2));
      
      // Now try to create the microcycle using the edge functions client
      try {
        const result = await edgeFunctions.planner.createMicrocycle({
          ...testData,
          clerk_id: userId, // Include clerk_id for coach lookup
          coach_id: coachId // Explicitly include the coach ID to bypass lookup
        });
        
        console.log(`[Test] Microcycle creation response:`, result);
        return result;
      } catch (err) {
        console.error(`[Test] Error creating microcycle:`, err);
        throw err;
      }
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