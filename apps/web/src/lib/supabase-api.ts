/**
 * Supabase Functions API Client
 * 
 * This module provides standardized methods for calling Supabase Edge Functions,
 * avoiding the duplicate 'api' path issue by carefully formatting the function names.
 */
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calls a Supabase Edge Function without duplicate API path
 * 
 * @param supabase The Supabase client instance
 * @param path The path (without leading /api)
 * @param method The HTTP method to use
 * @param body Optional request body
 * @returns The parsed response data
 */
export async function invokeFunction(
  supabase: SupabaseClient,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
) {
  // Remove any leading slashes, but preserve path segments
  const cleanPath = path.replace(/^\/+/, '');
  
  // Construct the full edge function name including its path segments
  const functionName = `api/${cleanPath}`;
  
  // Invoke the function with the proper function name
  const { data: rawData, error } = await supabase.functions.invoke(functionName, {
    method,
    body,
  });
  
  if (error) throw error;
  
  // Parse the response data
  const jsonData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  return jsonData;
}

/**
 * Predefined API namespaces for common operations
 */
export const dashboardApi = {
  // Dashboard APIs
  getExercisesInit: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'dashboard/exercisesInit'),
  
  getWeeklyOverview: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'dashboard/weeklyOverview'),
  
  getMesocycle: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'dashboard/mesocycle'),
  
  getExercises: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'dashboard/exercises'),
  
  createTrainingSession: (supabase: SupabaseClient, data: any) => 
    invokeFunction(supabase, 'dashboard/trainingSession', 'POST', data),
  
  updateTrainingSession: (supabase: SupabaseClient, data: any) => 
    invokeFunction(supabase, 'dashboard/trainingSession', 'PUT', data),
};

export const eventsApi = {
  // Events APIs
  getAll: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'events'),
  
  getById: (supabase: SupabaseClient, id: string) => 
    invokeFunction(supabase, `events/${id}`),
};

export const athletesApi = {
  // Athletes APIs
  getAll: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'athletes'),
  
  getById: (supabase: SupabaseClient, id: string) => 
    invokeFunction(supabase, `athletes/${id}`),
};

export const plannerApi = {
  // Planner APIs
  getExercises: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'planner/exercises'),
  
  createMicrocycle: (supabase: SupabaseClient, data: any) => 
    invokeFunction(supabase, 'planner/microcycle', 'POST', data),
  
  createMesocycle: (supabase: SupabaseClient, data: any) => 
    invokeFunction(supabase, 'planner/mesocycle', 'POST', data),
};

export const usersApi = {
  // User APIs
  getStatus: (supabase: SupabaseClient) => 
    invokeFunction(supabase, 'user-status'),
  
  getProfile: (supabase: SupabaseClient, userId: string) => 
    invokeFunction(supabase, `users/${userId}/profile`),
  
  update: (supabase: SupabaseClient, userId: string, data: any) => 
    invokeFunction(supabase, `users/${userId}`, 'PUT', data),
};

// Base function to invoke the Supabase Edge Functions with proper error handling
const invokeEdgeFunction = async (
  supabase: SupabaseClient,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) => {
  try {
    // Remove any leading slashes to avoid double slashes in the path
    const cleanPath = path.replace(/^\/+/, '');
    
    // Invoke the 'api' edge function, passing the path as part of the path parameter
    const { data: rawData, error } = await supabase.functions.invoke('api', {
      method,
      // Path is passed directly to the 'api' function name
      body
    });

    if (error) throw error;
    
    // Parse the response if it's a string
    const response = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    
    // Return data directly and normalize error format
    if (response && response.status === 'success') {
      return response.data ? response.data : response;
    } else if (response && response.status === 'error') {
      throw new Error(response.message || 'API error');
    }
    
    return response;
  } catch (error) {
    console.error(`API error for ${path}:`, error);
    throw error;
  }
};

// Events API
export const eventsApiEdge = {
  getAll: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'events');
  },
  
  getById: async (supabase: SupabaseClient, id: string) => {
    return invokeEdgeFunction(supabase, `events/${id}`);
  },
  
  create: async (supabase: SupabaseClient, data: any) => {
    return invokeEdgeFunction(supabase, 'events', 'POST', data);
  },
  
  update: async (supabase: SupabaseClient, id: string, data: any) => {
    return invokeEdgeFunction(supabase, `events/${id}`, 'PUT', data);
  },
  
  delete: async (supabase: SupabaseClient, id: string) => {
    return invokeEdgeFunction(supabase, `events/${id}`, 'DELETE');
  }
};

// Athletes API
export const athletesApiEdge = {
  getAll: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'athletes');
  },
  
  getById: async (supabase: SupabaseClient, id: string) => {
    return invokeEdgeFunction(supabase, `athletes/${id}`);
  }
};

// Dashboard API
export const dashboardApiEdge = {
  getInit: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'dashboard/exercisesInit');
  },
  
  getWeeklyOverview: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'dashboard/weeklyOverview');
  },
  
  getMesocycle: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'dashboard/mesocycle');
  },
  
  getExercises: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'dashboard/exercises');
  },
  
  createTrainingSession: async (supabase: SupabaseClient, data: any) => {
    return invokeEdgeFunction(supabase, 'dashboard/trainingSession', 'POST', data);
  },
  
  updateTrainingSession: async (supabase: SupabaseClient, data: any) => {
    return invokeEdgeFunction(supabase, 'dashboard/trainingSession', 'PUT', data);
  }
};

// Planner API
export const plannerApiEdge = {
  getExercises: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'planner/exercises');
  },
  
  createMicrocycle: async (supabase: SupabaseClient, data: any) => {
    return invokeEdgeFunction(supabase, 'planner/microcycle', 'POST', data);
  },
  
  createMesocycle: async (supabase: SupabaseClient, data: any) => {
    return invokeEdgeFunction(supabase, 'planner/mesocycle', 'POST', data);
  }
};

// Users API
export const usersApiEdge = {
  getStatus: async (supabase: SupabaseClient) => {
    return invokeEdgeFunction(supabase, 'user-status');
  },
  
  getProfile: async (supabase: SupabaseClient, userId: string) => {
    return invokeEdgeFunction(supabase, `users/${userId}/profile`);
  },
  
  update: async (supabase: SupabaseClient, userId: string, data: any) => {
    return invokeEdgeFunction(supabase, `users/${userId}`, 'PUT', data);
  }
};

// Export all APIs as a unified object
export const supabaseApi = {
  events: eventsApiEdge,
  athletes: athletesApiEdge,
  dashboard: dashboardApiEdge,
  planner: plannerApiEdge,
  users: usersApiEdge
};

export default supabaseApi;