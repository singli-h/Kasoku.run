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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new EdgeFunctionError(
      "NEXT_PUBLIC_SUPABASE_URL is not defined",
      500,
      null,
      endpoint
    );
  }
  
  if (!serviceRoleKey) {
    throw new EdgeFunctionError(
      "Supabase API key is not defined",
      500,
      null,
      endpoint
    );
  }
  
  // Make sure endpoint starts with "/"
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Build the full URL to the edge function
  const url = `${supabaseUrl}/functions/v1${path}`;
  
  try {
    // Log the request (without sensitive data)
    console.log(`[Edge Function] ${options.method || 'GET'} ${endpoint}`);
    
    // Set default headers
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
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
        console.error('Error serializing request body:', e);
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
      
      console.error(`[Edge Function Error] ${endpoint}:`, {
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
    console.log(`[Edge Function Success] ${endpoint}`);
    return data;
  } catch (error) {
    // If it's already an EdgeFunctionError, rethrow it
    if (error instanceof EdgeFunctionError) {
      throw error;
    }
    
    // Otherwise, wrap it in an EdgeFunctionError
    console.error(`[Edge Function Error] ${endpoint}:`, error);
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
      // Extract the base clerk_id without any query parameters
      const baseClerkId = clerkId.split('?')[0];
      console.log('[Edge Function Client] Checking onboarding status for clerk_id:', baseClerkId);
      
      // Use the proper endpoint, which is /api/users/{clerkId}/status
      // This matches the Edge Function route that handles the getUserStatus function
      const url = `/api/users/${baseClerkId}/status`;
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const finalUrl = `${url}?_t=${timestamp}`;
      
      console.log('[Edge Function Client] Requesting URL:', finalUrl);
      
      return fetchFromEdgeFunction(finalUrl)
        .then(data => {
          console.log('[Edge Function Client] Onboarding status response:', JSON.stringify(data));
          if (data && data.status === "success" && data.data) {
            console.log('[Edge Function Client] Onboarding completed value:', data.data.onboardingCompleted);
            return { 
              users: [{ onboarding_completed: data.data.onboardingCompleted }] 
            };
          } else {
            console.log('[Edge Function Client] User not found or data malformed:', data);
            return { users: [] };
          }
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
    // Create a mesocycle plan
    createMesocycle: (data) => fetchFromEdgeFunction("/api/planner", {
      method: "POST",
      body: {
        planType: "mesocycle",
        userRole: "coach",
        ...data
      }
    }),
    
    // Create a microcycle plan
    createMicrocycle: (data) => fetchFromEdgeFunction("/api/planner", {
      method: "POST",
      body: {
        planType: "microcycle",
        userRole: "coach",
        ...data
      }
    }),
    
    // Get available exercises for planner
    getExercises: () => fetchFromEdgeFunction("/api/planner?type=exercises"),
    
    // Get a specific mesocycle
    getMesocycle: (id) => fetchFromEdgeFunction(`/api/planner?type=mesocycle&id=${id}`),
    
    // Get a specific microcycle
    getMicrocycle: (id) => fetchFromEdgeFunction(`/api/planner?type=microcycle&id=${id}`)
  }
}; 