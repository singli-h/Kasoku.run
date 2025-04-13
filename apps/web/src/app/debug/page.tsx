"use client"

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function DebugPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isLoaded && userId) {
      checkStatus();
    }
  }, [isLoaded, userId]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch('/api/debug-onboarding');
      const data = await response.json();
      console.log('Debug data:', data);
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setMessage('Error checking status: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const forceOnboardingComplete = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch('/api/debug-onboarding', {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Force update result:', data);
      setMessage('Onboarding status has been set to complete!');
      await checkStatus();
    } catch (error) {
      console.error('Error forcing status:', error);
      setMessage('Error updating status: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!userId) {
    return <div className="p-8">Please sign in to use this debug page</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Debug Onboarding Status</h1>
      
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">User Info:</h2>
        <p>User ID: {userId}</p>
        <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
        <p>Name: {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button 
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Check Status
        </button>
        
        <button 
          onClick={forceOnboardingComplete}
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
        >
          Force Onboarding Complete
        </button>
      </div>

      {message && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
          {message}
        </div>
      )}

      {loading && <p className="mb-4">Loading...</p>}

      {status && (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Status Result:</h2>
          <pre className="whitespace-pre-wrap bg-slate-200 dark:bg-slate-700 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <Link href="/onboarding" className="text-blue-500 hover:underline">
          Go to Onboarding
        </Link>
        {' | '}
        <Link href="/planner" className="text-blue-500 hover:underline">
          Go to Planner
        </Link>
      </div>
    </div>
  );
} 