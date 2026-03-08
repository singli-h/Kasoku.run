/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * ESLint custom rule: enforce-conventions
 *
 * This rule enforces several conventions for the Kasoku codebase:
 * 1. Files in `apps/web/app/` and `apps/web/actions/` must start with "use client" or "use server".
 * 2. Files in `apps/web/actions/` must have filenames ending in `-actions.ts`.
 * 3. Exported async functions in files ending with `-actions.ts` must have names ending in `Action`.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce project-specific file and function naming conventions.',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      missingDirective: 'File must start with "use client" or "use server" directive.',
      badActionFilename: 'Action file "{{filename}}" must end with -actions.ts.',
      badActionName: 'Exported async function "{{functionName}}" in an action file must end with "Action".',
    },
  },

  create(context) {
    const filename = context.getFilename()
    const workspaceRoot = '/Users/singli/Documents/GitHub/RunningWebsite/';
    const relativePath = filename.startsWith(workspaceRoot) ? filename.substring(workspaceRoot.length) : filename;

    // Ignore non-TS/TSX files, tests, and config files
    if (!/\.(ts|tsx)$/.test(filename) || filename.includes('.d.ts') || filename.includes('.test.') || filename.includes('.spec.') || filename.includes('__tests__') || filename.includes('node_modules')) {
      return {}
    }

    function checkDirective(programNode) {
        if (!relativePath.startsWith('apps/web/app/') && !relativePath.startsWith('apps/web/actions/')) {
            return;
        }

        // Allow some files to not have directives
        const allowedNoDirective = [
            'app/api/', 
            'app/global-error.tsx', 
            'app/globals.css',
            'app/layout.tsx',
            'app/page.tsx',
            'middleware.ts'
        ];

        if (allowedNoDirective.some(p => relativePath.includes(p))) {
            return;
        }

        const firstNode = programNode.body[0];
        if (!firstNode || firstNode.type !== 'ExpressionStatement' || firstNode.expression.type !== 'Literal') {
            context.report({ node: programNode, messageId: 'missingDirective' });
            return;
        }
    
        const directive = firstNode.expression.value;
        if (directive !== 'use server' && directive !== 'use client') {
            context.report({ node: firstNode, messageId: 'missingDirective' });
        }
    }

    function checkActionConvention(node) {
        if (!relativePath.startsWith('apps/web/actions/')) {
            return;
        }
    
        const basename = filename.split('/').pop()
        if (!basename.endsWith('-actions.ts')) {
            context.report({ node, messageId: 'badActionFilename', data: { filename: basename } });
        }
    
        if (
            node.declaration &&
            node.declaration.type === 'FunctionDeclaration' &&
            node.declaration.async
        ) {
            const functionName = node.declaration.id.name;
            if (!functionName.endsWith('Action')) {
            context.report({
                node: node.declaration.id,
                messageId: 'badActionName',
                data: { functionName },
            });
            }
        }
    }

    return {
      Program: checkDirective,
      ExportNamedDeclaration: checkActionConvention,
    }
  },
} 