/**
 * Edge Functions API Client
 * 
 * This utility provides functions to make API calls to Supabase Edge Functions
 * instead of using the REST API directly.
 */

/**
 * Custom error class for Edge Function API errors
 */
export class EdgeFunctionError extends Error {
  constructor(message, status, data, endpoint) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
  }
}

/**
 * Makes a fetch request to a Supabase Edge Function
 * 
 * @param {string} endpoint - The endpoint path (e.g., "/api/events")
 * @param {Object} options - Fetch options (method, headers, body)
 * @returns {Promise<Object>} - Parsed JSON response
 * @throws {EdgeFunctionError} - When the request fails
 */
export async function fetchFromEdgeFunction(endpoint, options = {}) {
  try {
    // Make sure endpoint starts with "/"
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    
    // Build the full URL
    let url;
    try {
      // First try to use the base URL from environment
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      url = new URL(path, baseUrl || 'http://localhost:3000').toString();
      
      // Log the constructed URL (without sensitive data)
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    } catch (urlError) {
      // If URL construction fails, try using relative path
      console.log(`[API Request] Using relative path: ${path}`);
      url = path;
    }
    
    // Set default headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    
    // Properly serialize body to JSON if it's an object
    let requestBody = undefined;
    if (options.body) {
      try {
        requestBody = typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body);
      } catch (e) {
        console.error('[API Error] Failed to serialize request body:', e);
        throw new EdgeFunctionError(
          `Failed to serialize request body: ${e.message}`,
          500,
          null,
          endpoint
        );
      }
    }
    
    // Make the request
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: requestBody,
      credentials: 'include', // Include cookies for auth
      cache: 'no-store', // Prevent caching
      ...options,
      // Override options.body as we've already processed it
      body: requestBody
    });
    
    // Handle non-success responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errorData = null;
      
      try {
        errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If not valid JSON, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      console.error(`[API Error] ${endpoint}:`, {
        status: response.status,
        message: errorMessage,
        data: errorData
      });
      
      throw new EdgeFunctionError(
        errorMessage,
        response.status,
        errorData,
        endpoint
      );
    }
    
    // Parse and return the response
    const data = await response.json();
    console.log(`[API Success] ${endpoint}`);
    return data;
  } catch (error) {
    // If it's already an EdgeFunctionError, rethrow it
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    
    // Otherwise, wrap it in an EdgeFunctionError
    console.error(`[API Error] ${endpoint}:`, error);
    throw new EdgeFunctionError(
      error.message || 'Unknown error occurred',
      error.status || 500,
      error.data || null,
      endpoint
    );
  }
}

/**
 * Edge Function API client methods
 */
export const edgeFunctions = {
  // Events APIs
  events: {
    getAll: () => fetchFromEdgeFunction("/api/events"),
    getById: (id) => fetchFromEdgeFunction(`/api/events/${id}`),
    create: (data) => fetchFromEdgeFunction("/api/events", {
      method: "POST",
      body: data
    }),
    update: (id, data) => fetchFromEdgeFunction(`/api/events/${id}`, {
      method: "PUT",
      body: data
    }),
    delete: (id) => fetchFromEdgeFunction(`/api/events/${id}`, {
      method: "DELETE"
    })
  },
  
  // Athletes APIs
  athletes: {
    getAll: () => fetchFromEdgeFunction("/api/athletes"),
    getById: (id) => fetchFromEdgeFunction(`/api/athletes/${id}`),
    create: (data) => fetchFromEdgeFunction("/api/athletes", {
      method: "POST",
      body: data
    }),
    update: (id, data) => fetchFromEdgeFunction(`/api/athletes/${id}`, {
      method: "PUT",
      body: data
    }),
    delete: (id) => fetchFromEdgeFunction(`/api/athletes/${id}`, {
      method: "DELETE"
    })
  },
  
  // User APIs
  users: {
    onboard: (userData) => fetchFromEdgeFunction("/api/onboarding/user", {
      method: "POST",
      body: userData
    }),
    getStatus: (clerkId) => fetchFromEdgeFunction(`/api/users/${clerkId}/status`),
    getProfile: (clerkId) => {
      // Extract the base clerk_id without any query parameters
      const baseClerkId = clerkId.split('?')[0];
      console.log('[Edge Function Client] Fetching profile for clerk_id:', baseClerkId);
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const url = `/api/users/${baseClerkId}/profile?_t=${timestamp}`;
      
      return fetchFromEdgeFunction(url);
    },
    checkOnboarding: (clerkId) => {
      // Add timestamp for cache busting - critical for auth checks
      const timestamp = Date.now();
      
      console.log('[Client] Checking onboarding status via API for clerk_id:', clerkId);
      
      // Call our own Next.js API route which handles all the authentication
      // and communication with the Supabase edge function
      const url = `/api/user-status?t=${timestamp}`;
      
      console.log('[Client] Requesting URL:', url);
      
      // Using fetch with credentials included to ensure auth cookies are sent
      return fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          console.error('[Client] Error response from user-status API:', response.status);
          throw new Error(`Error checking onboarding status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Client] Onboarding status response:', JSON.stringify(data));
        
        // The API returns { onboardingCompleted: boolean }
        if (data && data.hasOwnProperty('onboardingCompleted')) {
          console.log('[Client] Onboarding completed value:', data.onboardingCompleted);
          
          // Return in the expected format for backward compatibility
          return { 
            users: [{ onboarding_completed: data.onboardingCompleted }] 
          };
        } else {
          console.log('[Client] User not found or data malformed:', data);
          return { users: [] };
        }
      })
      .catch(error => {
        console.error('[Client] Error checking onboarding status:', error);
        // Default to assuming onboarding is completed to prevent redirect loops in production
        return { users: [{ onboarding_completed: true }] };
      });
    },
    update: (clerkId, data) => fetchFromEdgeFunction(`/api/users/${clerkId}`, {
      method: "PUT",
      body: data
    })
  },
  
  // Dashboard APIs
  dashboard: {
    getExercisesInit: () => fetchFromEdgeFunction("/api/dashboard/exercisesInit"),
    createTrainingSession: (data) => fetchFromEdgeFunction("/api/dashboard/trainingSession", {
      method: "POST",
      body: data
    }),
    updateTrainingSession: (data) => fetchFromEdgeFunction("/api/dashboard/trainingSession", {
      method: "PUT",
      body: data
    }),
    getTrainingSession: (id) => fetchFromEdgeFunction(`/api/dashboard/trainingSession/${id}`),
    getAllTrainingSessions: () => fetchFromEdgeFunction("/api/dashboard/trainingSession"),
    getWeeklyOverview: () => fetchFromEdgeFunction("/api/dashboard/weeklyOverview"),
    getMesocycle: () => fetchFromEdgeFunction("/api/dashboard/mesocycle"),
    getExercises: () => fetchFromEdgeFunction("/api/dashboard/exercises")
  },
  
  // Planner APIs
  planner: {
    getExercises: () => fetchFromEdgeFunction("/api/planner/exercises"),
    getMesocycle: (id) => fetchFromEdgeFunction(`/api/planner/mesocycle?id=${id}`),
    getMicrocycle: (id) => fetchFromEdgeFunction(`/api/planner/microcycle?id=${id}`),
    createMesocycle: (data) => fetchFromEdgeFunction("/api/planner/mesocycle", {
      method: 'POST',
      body: data
    }),
    createMicrocycle: (data) => fetchFromEdgeFunction("/api/planner/microcycle", {
      method: 'POST',
      body: data
    })
  }
}; 