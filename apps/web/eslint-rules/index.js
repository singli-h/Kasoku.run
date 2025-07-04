/**
 * Custom ESLint rules for Kasoku
 */
import noRecreateSupabase from './no-recreate-supabase.js'
import enforceConventions from './enforce-conventions.js'

export default {
  rules: {
    'no-recreate-supabase': noRecreateSupabase,
    'enforce-conventions': enforceConventions,
  },
} 