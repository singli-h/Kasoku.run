/**
 * ESLint custom rule: no-recreate-supabase
 * 
 * Prevents direct usage of createClient from @supabase/supabase-js outside of
 * the singleton helper file (supabase-server.ts) and restricts createClientSupabaseClient
 * usage in client components to encourage server action usage.
 * 
 * This ensures all server-side code uses the shared Supabase client instance
 * and client components use server actions for better performance and consistency.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct usage of createClient and createClientSupabaseClient outside appropriate contexts',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noRecreateSupabase: 'Use the singleton Supabase client from "@/lib/supabase-server" instead of creating a new client directly. This improves performance by avoiding repeated client instantiation.',
      noClientSupabase: 'Use server actions instead of direct Supabase client calls in components. This ensures better caching, error handling, and follows the established data fetching pattern.',
    },
  },

  create(context) {
    const filename = context.getFilename()
    const sourceCode = context.getSourceCode()
    
    // Check for client-side files
    const text = sourceCode.getText()
    const isClientFile = text.includes('"use client"') || text.includes("'use client'")
    
    // Skip the singleton helper files themselves
    if (filename.endsWith('supabase-server.ts') || 
        filename.endsWith('supabase-server.js') ||
        filename.endsWith('supabase-client.ts') ||
        filename.endsWith('supabase-client.js')) {
      return {}
    }
    
    // Skip test files and node_modules
    if (filename.includes('.test.') || 
        filename.includes('.spec.') || 
        filename.includes('__tests__') || 
        filename.includes('node_modules') || 
        filename.includes('.next')) {
      return {}
    }

    return {
      // Check for createClient imports (server-side)
      ImportDeclaration(node) {
        if (node.source.value === '@supabase/supabase-js') {
          // Check if createClient is being imported
          const hasCreateClient = node.specifiers.some(spec => {
            return (
              (spec.type === 'ImportSpecifier' && spec.imported.name === 'createClient') ||
              (spec.type === 'ImportNamespaceSpecifier') ||
              (spec.type === 'ImportDefaultSpecifier')
            )
          })
          
          if (hasCreateClient && !isClientFile) {
            context.report({
              node,
              messageId: 'noRecreateSupabase',
            })
          }
        }
      },
      
      // Check for function calls
      CallExpression(node) {
        // Check for createClientSupabaseClient usage in client components
        if (isClientFile && node.callee.name === 'createClientSupabaseClient') {
          context.report({
            node,
            messageId: 'noClientSupabase',
          })
        }
        
        // Direct call to createClient (server-side)
        if (!isClientFile && node.callee.name === 'createClient') {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
        
        // Member expression call (e.g., supabase.createClient)
        if (!isClientFile &&
            node.callee.type === 'MemberExpression' &&
            node.callee.property.name === 'createClient') {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
        
        // Check for require() calls to @supabase/supabase-js (server-side)
        if (!isClientFile &&
            node.callee.name === 'require' &&
            node.arguments.length === 1 &&
            node.arguments[0].type === 'Literal' &&
            node.arguments[0].value === '@supabase/supabase-js') {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
      },
    }
  },
} 