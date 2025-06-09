"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import Image from "next/image";

/**
 * Loading fallback component for SSO callback
 */
function SSOLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="Kasoku Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Loading...</h1>
    </div>
  );
}

/**
 * SSO callback content component that handles the actual OAuth flow
 * This component uses useSearchParams and must be wrapped in Suspense
 */
function SSOCallbackContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;

    // If already signed in, redirect to session handler
    if (isSignedIn) {
      router.push('/auth/session');
      return;
    }

    async function processCallback() {
      try {
        // Get verification status from Clerk
        const verification = searchParams.get("__clerk_status");
        const createdSessionId = searchParams.get("createdSessionId");

        if (verification !== "verified" || !createdSessionId) {
          console.error("Invalid verification or missing session ID");
          router.push("/sign-in");
          return;
        }

        // Try sign-in first, then sign-up
        if (signIn) {
          await setActiveSignIn({ session: createdSessionId });
        } else if (signUp) {
          await setActiveSignUp({ session: createdSessionId });
        } else {
          throw new Error("Neither signIn nor signUp available");
        }

        // Redirect to session handler for onboarding check
        router.push('/auth/session');
      } catch (error) {
        console.error("Error processing SSO callback:", error);
        router.push("/sign-in");
      }
    }

    processCallback();
  }, [isLoaded, isSignedIn, router, signIn, signUp, setActiveSignIn, setActiveSignUp, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="Kasoku Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Completing sign in...</h1>
    </div>
  );
}

/**
 * Main SSO callback page component
 * Properly wraps the content with Suspense for React 19 compatibility
 */
export default function SSOCallbackPage() {
  return (
    <Suspense fallback={<SSOLoadingFallback />}>
      <SSOCallbackContent />
    </Suspense>
  );
} 