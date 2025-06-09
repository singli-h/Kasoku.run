"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import Image from "next/image";

/**
 * Loading fallback component for sign-in SSO callback
 */
function SignInSSOLoadingFallback() {
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
 * Sign-in SSO callback content component
 * This component uses useSearchParams and must be wrapped in Suspense
 */
function SignInSSOCallbackContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
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

    async function processSignInCallback() {
      try {
        // Get the session ID from the callback
        const createdSessionId = searchParams.get("createdSessionId");
        
        if (!createdSessionId || !signIn) {
          console.error("Missing createdSessionId or signIn not ready");
          router.push("/sign-in");
          return;
        }

        // Activate the session
        await setActive({ session: createdSessionId });
        
        // Redirect to session handler for onboarding check
        router.push('/auth/session');
      } catch (error) {
        console.error("Error processing sign-in SSO callback:", error);
        router.push("/sign-in");
      }
    }

    processSignInCallback();
  }, [isLoaded, isSignedIn, router, signIn, setActive, searchParams]);

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
 * Main sign-in SSO callback page component
 * Properly wraps the content with Suspense for React 19 compatibility
 */
export default function SignInSSOCallbackPage() {
  return (
    <Suspense fallback={<SignInSSOLoadingFallback />}>
      <SignInSSOCallbackContent />
    </Suspense>
  );
} 