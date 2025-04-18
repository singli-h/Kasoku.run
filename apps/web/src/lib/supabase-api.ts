/**
 * Supabase Functions API Client
 * 
 * This module provides standardized methods for calling Supabase Edge Functions,
 * avoiding the duplicate 'api' path issue by carefully formatting the function names.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { useBrowserSupabaseClient } from './supabase';

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

// Create a hook to get the authenticated client
export function useSupabaseApiClient() {
  return useBrowserSupabaseClient();
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

// Export all APIs as a unified object
export const supabaseApi = {
  events: eventsApi,
  athletes: athletesApi,
  dashboard: dashboardApi,
  planner: plannerApi,
  users: usersApi
};

export default supabaseApi;