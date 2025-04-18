import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useBrowserSupabaseClient } from '@/lib/supabase';
import supabaseApi from '@/lib/supabase-api';

/**
 * Custom hook to check if the user has completed onboarding
 * and redirect accordingly.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.redirect - Whether to automatically redirect based on status
 * @param {string} options.redirectTo - Where to redirect if onboarding is incomplete
 * @param {boolean} options.requireOnboarding - Whether the current page requires onboarding to be complete
 * @returns {Object} The onboarding status and loading state
 */
export default function useOnboardingStatus({ 
  redirect = true, 
  redirectTo = '/onboarding',
  requireOnboarding = false 
} = {}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const supabase = useBrowserSupabaseClient();
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await supabaseApi.users.getStatus(supabase);
        setOnboardingCompleted(data.onboardingCompleted);
        
        // Handle redirects based on onboarding status
        if (redirect) {
          if (requireOnboarding && !data.onboardingCompleted) {
            // If the page requires onboarding to be complete, but it's not, redirect to onboarding
            router.push(redirectTo);
          } else if (!requireOnboarding && data.onboardingCompleted && window.location.pathname === '/onboarding') {
            // If we're on the onboarding page but it's already completed, redirect to dashboard
            router.push('/planner');
          } else if (!data.onboardingCompleted && window.location.pathname !== '/onboarding' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            // If onboarding is not completed and we're not on the login/register/onboarding pages, redirect to onboarding
            router.push(redirectTo);
          }
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [isLoaded, isSignedIn, redirect, redirectTo, requireOnboarding, router, supabase]);

  return { onboardingCompleted, isLoading, error };
} 