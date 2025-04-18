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
 * @param authToken Optional auth token to forward
 * @returns The parsed response data
 */
export async function invokeFunction(
  supabase: SupabaseClient,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  authToken?: string
) {
  // Remove any leading slashes, but preserve path segments
  const cleanPath = path.replace(/^\/+/, '');
  
  // Construct the full edge function name including its path segments
  const functionName = `api/${cleanPath}`;
  
  // Prepare headers: forward Clerk token if provided
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  // Use global fetch in Supabase client to inject Clerk session JWT
  const { data: rawData, error } = await supabase.functions.invoke(functionName, {
    method,
    body,
    headers,
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
  getExercisesInit: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/exercisesInit', 'GET', undefined, authToken),
  
  getWeeklyOverview: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/weeklyOverview', 'GET', undefined, authToken),
  
  getMesocycle: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/mesocycle', 'GET', undefined, authToken),
  
  getExercises: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/exercises', 'GET', undefined, authToken),
  
  createTrainingSession: async (supabase: SupabaseClient, data: any, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/trainingSession', 'POST', data, authToken),
  
  updateTrainingSession: async (supabase: SupabaseClient, data: any, authToken?: string) => 
    invokeFunction(supabase, 'dashboard/trainingSession', 'PUT', data, authToken),
};

export const eventsApi = {
  // Events APIs
  getAll: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'events', 'GET', undefined, authToken),
  
  getById: async (supabase: SupabaseClient, id: string, authToken?: string) => 
    invokeFunction(supabase, `events/${id}`, 'GET', undefined, authToken),
};

export const athletesApi = {
  // Athletes APIs
  getAll: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'athletes', 'GET', undefined, authToken),
  
  getById: async (supabase: SupabaseClient, id: string, authToken?: string) => 
    invokeFunction(supabase, `athletes/${id}`, 'GET', undefined, authToken),
};

export const plannerApi = {
  // Planner APIs
  getExercises: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'planner/exercises', 'GET', undefined, authToken),
  
  createMicrocycle: async (supabase: SupabaseClient, data: any, authToken?: string) => 
    invokeFunction(supabase, 'planner/microcycle', 'POST', data, authToken),
  
  createMesocycle: async (supabase: SupabaseClient, data: any, authToken?: string) => 
    invokeFunction(supabase, 'planner/mesocycle', 'POST', data, authToken),
};

export const usersApi = {
  // User APIs
  getStatus: async (supabase: SupabaseClient, authToken?: string) => 
    invokeFunction(supabase, 'user-status', 'GET', undefined, authToken),
  
  getProfile: async (supabase: SupabaseClient, userId: string, authToken?: string) => 
    invokeFunction(supabase, `users/${userId}/profile`, 'GET', undefined, authToken),
  
  update: async (supabase: SupabaseClient, userId: string, data: any, authToken?: string) => 
    invokeFunction(supabase, `users/${userId}`, 'PUT', data, authToken),
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