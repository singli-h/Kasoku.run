/**
 * Unit tests for no-recreate-supabase ESLint rule
 * 
 * Tests that the custom rule properly catches direct usage of createClient
 * from @supabase/supabase-js outside of the singleton helper.
 */

const { RuleTester } = require('eslint')
const rule = require('../eslint-rules/no-recreate-supabase')

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: { 
    ecmaVersion: 2020, 
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
})

ruleTester.run('no-recreate-supabase', rule, {
  valid: [
    // Client-side files should be allowed
    {
      code: `
        "use client"
        import { createClient } from "@supabase/supabase-js"
        const supabase = createClient(url, key)
      `,
      filename: 'components/client-component.tsx'
    },
    
    // Singleton helper file should be allowed
    {
      code: `
        import { createClient } from "@supabase/supabase-js"
        const supabase = createClient(url, key)
      `,
      filename: 'lib/supabase-server.ts'
    },
    
    // Test files should be allowed
    {
      code: `
        import { createClient } from "@supabase/supabase-js"
        const supabase = createClient(url, key)
      `,
      filename: '__tests__/some.test.ts'
    },
    
    // Using the singleton should be allowed
    {
      code: `
        import supabase from "@/lib/supabase-server"
        const { data } = await supabase.from('users').select('*')
      `,
      filename: 'actions/user-actions.ts'
    },
    
    // Other supabase imports should be allowed
    {
      code: `
        import type { Database } from "@supabase/supabase-js"
      `,
      filename: 'types/database.ts'
    }
  ],

  invalid: [
    // Direct createClient import in server file
    {
      code: `
        import { createClient } from "@supabase/supabase-js"
        const supabase = createClient(url, key)
      `,
      filename: 'actions/user-actions.ts',
      errors: [{
        messageId: 'noRecreateSupabase'
      }]
    },
    
    // Default import in server file
    {
      code: `
        import supabase from "@supabase/supabase-js"
        const client = supabase.createClient(url, key)
      `,
      filename: 'lib/some-helper.ts',
      errors: [{
        messageId: 'noRecreateSupabase'
      }]
    },
    
    // Namespace import in server file
    {
      code: `
        import * as Supabase from "@supabase/supabase-js"
        const client = Supabase.createClient(url, key)
      `,
      filename: 'actions/some-action.ts',
      errors: [{
        messageId: 'noRecreateSupabase'
      }]
    },
    
    // Direct createClient call
    {
      code: `
        const client = createClient(url, key)
      `,
      filename: 'lib/helper.ts',
      errors: [{
        messageId: 'noRecreateSupabase'
      }]
    },
    
    // CommonJS require
    {
      code: `
        const { createClient } = require("@supabase/supabase-js")
      `,
      filename: 'actions/legacy-action.js',
      errors: [{
        messageId: 'noRecreateSupabase'
      }]
    }
  ]
}) 