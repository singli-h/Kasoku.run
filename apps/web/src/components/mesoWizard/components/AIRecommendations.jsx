"use client"

import { memo } from "react"
import { Check, X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * AI Recommendations Component
 * 
 * Displays AI-generated recommendations for the mesocycle
 * and allows users to accept or reject them.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.aiSuggestions - AI suggestions data
 * @param {Function} props.handleAcceptSuggestion - Function to handle accepting a suggestion
 * @param {boolean} props.isLoading - Whether suggestions are loading
 */
const AIRecommendations = memo(({ aiSuggestions, handleAcceptSuggestion, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="mt-4 h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!aiSuggestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No recommendations available yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>AI Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>{aiSuggestions.overall}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          {aiSuggestions.suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`flex items-start justify-between p-3 rounded-md border ${
                suggestion.accepted ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm">{suggestion.text}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {suggestion.accepted ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Applied
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleAcceptSuggestion(suggestion.id)}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-gray-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

AIRecommendations.displayName = "AIRecommendations"

export default AIRecommendations 