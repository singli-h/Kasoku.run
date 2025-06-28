/**
 * ESLint plugin for internal Kasoku rules
 * 
 * This plugin contains custom ESLint rules specific to our codebase
 * to enforce best practices and prevent common mistakes.
 */

const noRecreateSupabase = require('./no-recreate-supabase')

module.exports = {
  rules: {
    'no-recreate-supabase': noRecreateSupabase,
  },
} 