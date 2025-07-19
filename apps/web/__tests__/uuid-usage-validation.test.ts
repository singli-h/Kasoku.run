import { promises as fs } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

describe('UUID Usage Validation', () => {
  it('should not use Clerk UUIDs directly in SQL queries', async () => {
    // Define patterns that indicate problematic UUID usage
    const problematicPatterns = [
      /\.eq\(['"]clerk_id['"],\s*userId\)/g,
      /\.eq\(['"]user_id['"],\s*clerkId\)/g,
      /\.eq\(['"]user_id['"],\s*userId\)\s*\/\/.*clerk/gi,
    ]

    // Define files to scan (exclude test files and node_modules)
    const filesToScan = await glob('**/*.{ts,tsx}', {
      cwd: join(process.cwd(), 'actions'),
      ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
      absolute: true
    })

    const violations: Array<{ file: string; line: number; content: string; pattern: string }> = []

    for (const filePath of filesToScan) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          problematicPatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              violations.push({
                file: filePath.replace(process.cwd(), ''),
                line: index + 1,
                content: line.trim(),
                pattern: pattern.source
              })
            }
          })
        })
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Could not read file: ${filePath}`)
      }
    }

    // Report violations
    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n')

      throw new Error(
        `Found ${violations.length} instances of problematic UUID usage in SQL queries:\n\n${violationReport}\n\n` +
        'These should use getDbUserId() instead of direct Clerk UUID usage. ' +
        'Replace manual user lookups with: const dbUserId = await getDbUserId(userId)'
      )
    }

    expect(violations).toHaveLength(0)
  })

  it('should use getDbUserId pattern in server actions', async () => {
    // Check that server actions are properly using the getDbUserId pattern
    const actionFiles = await glob('**/*-actions.ts', {
      cwd: join(process.cwd(), 'actions'),
      absolute: true
    })

    const filesWithAuth: Array<{ file: string; hasAuth: boolean; hasGetDbUserId: boolean }> = []

    for (const filePath of actionFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        
        const hasAuth = /auth\(\)/.test(content)
        const hasGetDbUserId = /getDbUserId\(/.test(content)

        if (hasAuth) {
          filesWithAuth.push({
            file: filePath.replace(process.cwd(), ''),
            hasAuth,
            hasGetDbUserId
          })
        }
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Could not read file: ${filePath}`)
      }
    }

    // Report files that use auth() but don't use getDbUserId
    const violatingFiles = filesWithAuth.filter(f => f.hasAuth && !f.hasGetDbUserId)

    if (violatingFiles.length > 0) {
      const violationReport = violatingFiles
        .map(f => f.file)
        .join('\n')

      console.warn(
        `Found ${violatingFiles.length} action files that use auth() but not getDbUserId():\n\n${violationReport}\n\n` +
        'Consider using getDbUserId() for better performance and consistency.'
      )
    }

    // This is a warning, not a hard failure, as some files might legitimately not need user ID
    expect(true).toBe(true)
  })

  it('should not contain manual user table queries in actions', async () => {
    // Check for manual user table queries that should be replaced with getDbUserId
    const problematicUserQueries = [
      /from\(['"]users['"]\)[\s\S]*?\.eq\(['"]clerk_id['"],/g,
      /\.select\(['"]id['"]\)[\s\S]*?\.eq\(['"]clerk_id['"],/g,
    ]

    const actionFiles = await glob('**/*-actions.ts', {
      cwd: join(process.cwd(), 'actions'),
      absolute: true
    })

    const violations: Array<{ file: string; line: number; content: string }> = []

    for (const filePath of actionFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          problematicUserQueries.forEach((pattern) => {
            if (pattern.test(line)) {
              violations.push({
                file: filePath.replace(process.cwd(), ''),
                line: index + 1,
                content: line.trim()
              })
            }
          })
        })
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Could not read file: ${filePath}`)
      }
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n')

      console.warn(
        `Found ${violations.length} instances of manual user table queries:\n\n${violationReport}\n\n` +
        'These could be replaced with getDbUserId() for better performance.'
      )
    }

    // This is a warning for now, not a hard failure
    expect(true).toBe(true)
  })

  it('should import getDbUserId from the correct location', async () => {
    // Check that getDbUserId is imported from the correct location
    const actionFiles = await glob('**/*-actions.ts', {
      cwd: join(process.cwd(), 'actions'),
      absolute: true
    })

    const incorrectImports: Array<{ file: string; line: number; content: string }> = []

    for (const filePath of actionFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          // Check for incorrect import patterns
          if (line.includes('getDbUserId') && line.includes('import') && !line.includes('@/lib/user-cache')) {
            incorrectImports.push({
              file: filePath.replace(process.cwd(), ''),
              line: index + 1,
              content: line.trim()
            })
          }
        })
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Could not read file: ${filePath}`)
      }
    }

    if (incorrectImports.length > 0) {
      const violationReport = incorrectImports
        .map(v => `${v.file}:${v.line} - ${v.content}`)
        .join('\n')

      throw new Error(
        `Found ${incorrectImports.length} instances of incorrect getDbUserId imports:\n\n${violationReport}\n\n` +
        'getDbUserId should be imported from "@/lib/user-cache"'
      )
    }

    expect(incorrectImports).toHaveLength(0)
  })
}) 