/**
 * Edge Functions Client
 * 
 * This module exports the edge functions client for making API calls
 * to Supabase Edge Functions. This is the ONLY way frontend should
 * interact with the database.
 */

export { edgeFunctions } from './edge-functions';

// Export individual domains for convenience
export const {
  events,
  athletes,
  users,
  dashboard
} = edgeFunctions; 