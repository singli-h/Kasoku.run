/**
 * ESLint custom rule: no-recreate-supabase
 * 
 * Prevents direct usage of createClient from @supabase/supabase-js outside of
 * the singleton helper file (supabase-server.ts).
 * 
 * This ensures all server-side code uses the shared Supabase client instance
 * for better performance and consistency.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct usage of createClient outside singleton helper',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noRecreateSupabase: 'Use the singleton Supabase client from "@/lib/supabase-server" instead of creating a new client directly. This improves performance by avoiding repeated client instantiation.',
    },
  },

  create(context) {
    const filename = context.getFilename()
    const sourceCode = context.getSourceCode()
    
    // Skip client-side files (those with "use client" directive)
    const text = sourceCode.getText()
    if (text.includes('"use client"') || text.includes("'use client'")) {
      return {}
    }
    
    // Skip the singleton helper file itself
    if (filename.endsWith('supabase-server.ts') || filename.endsWith('supabase-server.js')) {
      return {}
    }
    
    // Skip test files
    if (filename.includes('.test.') || filename.includes('.spec.') || filename.includes('__tests__')) {
      return {}
    }
    
    // Skip node_modules and .next directories
    if (filename.includes('node_modules') || filename.includes('.next')) {
      return {}
    }

    return {
      // Check for createClient imports
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
          
          if (hasCreateClient) {
            context.report({
              node,
              messageId: 'noRecreateSupabase',
            })
          }
        }
      },
      
      // Check for direct createClient calls
      CallExpression(node) {
        // Direct call to createClient
        if (node.callee.name === 'createClient') {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
        
        // Member expression call (e.g., supabase.createClient)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'createClient'
        ) {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
      },
      
      // Check for require() calls to @supabase/supabase-js
      CallExpression(node) {
        if (
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          node.arguments[0].value === '@supabase/supabase-js'
        ) {
          context.report({
            node,
            messageId: 'noRecreateSupabase',
          })
        }
      },
    }
  },
} 