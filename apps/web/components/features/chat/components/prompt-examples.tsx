"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Lightbulb, Code, AlertTriangle, CheckCircle, FileText, Zap } from "lucide-react"
import { useState } from "react"

const promptExamples = [
  {
    category: "Code Help",
    icon: <Code className="h-4 w-4" />,
    description: "Get syntax-highlighted code blocks",
    examples: [
      "Show me a React component with TypeScript",
      "Create a Python function to sort an array", 
      "Write a SQL query to join two tables",
      "Help me debug this JavaScript function"
    ]
  },
  {
    category: "Project Planning", 
    icon: <FileText className="h-4 w-4" />,
    description: "Get organized notes and tips",
    examples: [
      "Create a project timeline for a web app",
      "What are the best practices for API design?",
      "How should I structure my React components?",
      "Give me a checklist for deploying to production"
    ]
  },
  {
    category: "Quick Actions",
    icon: <Zap className="h-4 w-4" />,
    description: "Get actionable steps and commands",
    examples: [
      "Show me terminal commands to set up a new project",
      "What's the fastest way to implement authentication?",
      "Give me the steps to deploy on Vercel",
      "How do I connect to a PostgreSQL database?"
    ]
  },
  {
    category: "Troubleshooting",
    icon: <AlertTriangle className="h-4 w-4" />,
    description: "Get warnings and problem solutions",
    examples: [
      "I'm getting a CORS error, how do I fix it?",
      "My build is failing, what should I check?",
      "Performance issues with my React app",
      "Database connection timeout errors"
    ]
  }
]

const formatExamples = [
  {
    title: "📝 Notes",
    description: "Important information highlighted in blue",
    prompt: "Tell me about React hooks and include important notes about their usage"
  },
  {
    title: "💡 Tips", 
    description: "Best practices and helpful advice in purple",
    prompt: "Give me tips for optimizing my Next.js application"
  },
  {
    title: "⚠️ Warnings",
    description: "Cautions and things to watch out for in yellow", 
    prompt: "What are common security mistakes in web development?"
  },
  {
    title: "✅ Success",
    description: "Confirmations and positive outcomes in green",
    prompt: "Walk me through setting up authentication successfully"
  },
  {
    title: "🚀 Quick Actions",
    description: "Actionable steps and commands in a special card",
    prompt: "Show me the fastest way to deploy my app"
  },
  {
    title: "```code```",
    description: "Syntax-highlighted code blocks",
    prompt: "Create a TypeScript interface for a user profile"
  }
]

interface PromptExamplesProps {
  onPromptSelect?: (prompt: string) => void
}

export function PromptExamples({ onPromptSelect }: PromptExamplesProps) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)

  const copyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedPrompt(prompt)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎨 Rich Chat Formatting</h2>
        <p className="text-muted-foreground">
          Our AI can respond with beautiful formatting, code blocks, notes, and more!
        </p>
      </div>

      {/* Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Available Formatting Styles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {formatExamples.map((example, index) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {example.title}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyPrompt(example.prompt)}
                  >
                    {copiedPrompt === example.prompt ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {example.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto p-2 text-left justify-start"
                  onClick={() => onPromptSelect?.(example.prompt)}
                >
                  "{example.prompt}"
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prompt Categories */}
      <div className="grid md:grid-cols-2 gap-4">
        {promptExamples.map((category, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {category.icon}
                {category.category}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {category.examples.map((example, exampleIndex) => (
                  <Button
                    key={exampleIndex}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 text-left justify-start w-full"
                    onClick={() => onPromptSelect?.(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Pro Tip: Mix and Match!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                You can ask for multiple formatting styles in one message. Try: 
                "Explain React hooks with code examples, important notes, and tips for best practices"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 