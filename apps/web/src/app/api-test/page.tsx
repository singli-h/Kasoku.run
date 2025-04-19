"use client";

import { useState, useEffect } from 'react';
import { useSupabaseApiClient } from '@/lib/supabase-api';
import supabaseApi from '@/lib/supabase-api';
import { useAuth, useSession } from '@clerk/nextjs';

interface TestResult {
  name: string;
  success: boolean;
}

export default function ApiTest() {
  const supabase = useSupabaseApiClient();
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});
  const { userId, getToken } = useAuth();
  const { isLoaded: isSessionLoaded, isSignedIn } = useSession();
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [authHeaderStatus, setAuthHeaderStatus] = useState<"loading" | "success" | "error" | "waiting">("waiting");

  useEffect(() => {
    // Only try to get the token when the session is fully loaded
    if (!isSessionLoaded) {
      console.log("[API Test] Waiting for Clerk session to load...");
      setAuthHeaderStatus("waiting");
      return;
    }

    if (!isSignedIn) {
      console.log("[API Test] User not signed in");
      setAuthHeaderStatus("error");
      return;
    }

    async function checkAuthToken() {
      try {
        setAuthHeaderStatus("loading");
        console.log("[API Test] Session loaded, retrieving token...");
        const token = await getToken();
        if (!token) {
          console.error("[API Test] No token available from Clerk");
          setAuthHeaderStatus("error");
          setDebugToken(null);
        } else {
          // Only show first 10 characters and last 5 for security
          const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 5);
          setDebugToken(tokenPreview);
          
          // Test token format
          const [header, payload, signature] = token.split('.');
          if (!header || !payload || !signature) {
            console.error("[API Test] Token does not appear to be a valid JWT (needs 3 parts)");
            setAuthHeaderStatus("error");
          } else {
            console.log("[API Test] Token appears to be a valid JWT format");
            setAuthHeaderStatus("success");
            
            // Log JWT payload for debugging (decoded)
            try {
              const decodedPayload = JSON.parse(atob(payload));
              console.log("[API Test] Token payload:", {
                iss: decodedPayload.iss,
                sub: decodedPayload.sub,
                exp: new Date(decodedPayload.exp * 1000).toISOString(),
                iat: new Date(decodedPayload.iat * 1000).toISOString()
              });
            } catch (e) {
              console.error("[API Test] Failed to decode JWT payload", e);
            }
          }
        }
      } catch (error) {
        console.error("[API Test] Error getting auth token:", error);
        setAuthHeaderStatus("error");
        setDebugToken(null);
      }
    }
    
    checkAuthToken();
  }, [getToken, isSessionLoaded, isSignedIn]);

  // Helper function to get token, throws if not available
  const getAuthToken = async () => {
    // Make sure session is loaded
    if (!isSessionLoaded) {
      throw new Error('Clerk session not yet loaded');
    }
    
    if (!isSignedIn) {
      throw new Error('User not signed in');
    }
    
    const token = await getToken();
    if (!token) throw new Error('Authentication token not available');
    return token;
  };

  // Helper function to run a test
  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    console.log(`[API Test] Starting test: ${testName}`);
    setLoading(prev => {
      console.log(`[API Test] Setting loading state for ${testName}:`, true);
      return { ...prev, [testName]: true };
    });
    setError(prev => ({ ...prev, [testName]: null }));
    
    try {
      // First, ensure session is loaded and token is available
      if (!isSessionLoaded) {
        throw new Error('Clerk session not yet loaded - please wait');
      }
      
      console.log(`[API Test] Executing test function for ${testName}`);
      const result = await testFn();
      console.log(`[API Test] Test ${testName} completed successfully:`, result);
      setResults(prev => ({
        ...prev,
        [testName]: { result, error: null },
      }));
      return true;
    } catch (error) {
      console.error(`[API Test] Test ${testName} failed with error:`, error);
      setResults(prev => ({
        ...prev,
        [testName]: { result: null, error },
      }));
      setError(prev => ({ ...prev, [testName]: error }));
      return false;
    } finally {
      console.log(`[API Test] Cleaning up test ${testName}`);
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  // Get coach role for testing
  const addCoachRole = async () => {
    setLoading(prev => ({ ...prev, addCoachRole: true }));
    setError(prev => ({ ...prev, addCoachRole: null }));
    
    try {
      console.log(`[Test] Adding coach role for user: ${userId}`);
      // Ensure session is active
      await getAuthToken();
      const data = await supabaseApi.users.update(supabase, {
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
    getEvents: async () => {
      await getAuthToken();
      return supabaseApi.events.getAll(supabase);
    },
    getAthletes: async () => {
      await getAuthToken();
      return supabaseApi.athletes.getAll(supabase);
    },
    getDashboardInit: async () => {
      await getAuthToken();
      return supabaseApi.dashboard.getExercisesInit(supabase);
    },
    testUserStatus: async () => {
      await getAuthToken();
      return supabaseApi.users.getStatus(supabase);
    },
    getUserProfile: async () => {
      await getAuthToken();
      return supabaseApi.users.getProfile(supabase);
    },
  };

  // Run all tests
  const runAllTests = async () => {
    // First, ensure session is loaded
    if (!isSessionLoaded) {
      alert('Clerk session not yet loaded - please wait');
      return [];
    }
    
    const results: TestResult[] = [];
    for (const [name, test] of Object.entries(tests)) {
      const success = await runTest(name, test);
      results.push({ name, success });
    }
    return results;
  };

  if (!isSessionLoaded) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          <p>Loading Clerk session, please wait...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>You must be signed in to use the API test page. Please sign in first.</p>
        </div>
      </div>
    );
  }

  // Debug display for JWT and anon-key
  const anonKeyPrefix = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || '';
  

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>This page tests the connection to various API endpoints.</p>
          <p>User ID: {userId}</p>
          <p>Session Status: {isSessionLoaded ? 'Loaded' : 'Loading...'}</p>
        </div>
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <div className={`p-2 mb-4 ${
          authHeaderStatus === "success" ? "bg-green-100" : 
          authHeaderStatus === "error" ? "bg-red-100" : 
          authHeaderStatus === "waiting" ? "bg-yellow-100" : 
          "bg-gray-100"
        }`}>
          <p>Clerk Supabase JWT: {debugToken || 'none'}</p>
          <p>Token Status: {
            authHeaderStatus === "waiting" ? "Waiting for session..." :
            authHeaderStatus === "loading" ? "Checking..." : 
            authHeaderStatus === "success" ? "Valid token format" : 
            "⚠️ Invalid token format"
          }</p>
        </div>
        <pre className="bg-gray-100 p-2 mb-4">Anon Key Prefix: {anonKeyPrefix}</pre>
      </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Individual Tests</h2>
          {Object.entries(tests).map(([name, test]) => (
            <div key={name} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{name}</h3>
                <button
                  onClick={() => runTest(name, test)}
                  disabled={loading[name] || !isSessionLoaded}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading[name] ? 'Running...' : 'Run Test'}
                </button>
              </div>
              
              {error[name] && (
                <div className="mt-2 text-red-600">
                  Error: {error[name].message}
                </div>
              )}
              
              {results[name] && (
                <div className="mt-2">
                  <pre className="bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(results[name], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={runAllTests}
            disabled={!isSessionLoaded}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Run All Tests
          </button>
        </div>
      </div>
    </div>
  );
} 