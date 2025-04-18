"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useBrowserSupabaseClient } from '@/lib/supabase';
import supabaseApi from '@/lib/supabase-api';
import Image from "next/image";

/**
 * Session Handler Page
 * 
 * This page is responsible for checking onboarding status after login
 * and redirecting the user to the appropriate page.
 */
export default function SessionHandler() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const supabase = useBrowserSupabaseClient();

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) return;

    // If user is not signed in, redirect to login
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    async function checkOnboardingStatus() {
      try {
        const data = await supabaseApi.users.getStatus(supabase);
        
        // Redirect based on onboarding status
        if (data.onboardingCompleted) {
          // If onboarding is completed, go to planner
          router.push('/planner');
        } else {
          // If onboarding is not completed, go to onboarding
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding on error
        router.push('/onboarding');
      }
    }

    // Check onboarding status
    checkOnboardingStatus();
  }, [isLoaded, isSignedIn, router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="RunningApp Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Redirecting you to the right place...</h1>
    </div>
  );
} 