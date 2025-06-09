"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { INDUSTRY_OPTIONS, TEAM_SIZE_OPTIONS, MIN_COMPANY_NAME_LENGTH, MAX_COMPANY_NAME_LENGTH } from '../constants'
import { validateCompanyNameAction } from '@/actions/auth/organization-wizard-actions'
import type { OrganizationWizardData } from '../types'

interface BusinessDetailsStepProps {
  data: OrganizationWizardData
  onUpdate: (updates: Partial<OrganizationWizardData>) => void
  onNext: () => void
  canGoNext: boolean
}

export function BusinessDetailsStep({ data, onUpdate, onNext, canGoNext }: BusinessDetailsStepProps) {
  const [companyNameValidation, setCompanyNameValidation] = useState<{
    isValidating: boolean
    isAvailable: boolean | null
    message: string
  }>({
    isValidating: false,
    isAvailable: null,
    message: ''
  })

  const validateCompanyName = async (name: string) => {
    if (name.length < MIN_COMPANY_NAME_LENGTH) {
      setCompanyNameValidation({
        isValidating: false,
        isAvailable: false,
        message: `Company name must be at least ${MIN_COMPANY_NAME_LENGTH} characters`
      })
      return
    }

    if (name.length > MAX_COMPANY_NAME_LENGTH) {
      setCompanyNameValidation({
        isValidating: false,
        isAvailable: false,
        message: `Company name must be less than ${MAX_COMPANY_NAME_LENGTH} characters`
      })
      return
    }

    setCompanyNameValidation(prev => ({ ...prev, isValidating: true }))

    const result = await validateCompanyNameAction(name)
    
    setCompanyNameValidation({
      isValidating: false,
      isAvailable: result.isSuccess ? result.data.isAvailable : false,
      message: result.message
    })
  }

  useEffect(() => {
    if (data.companyName.trim()) {
      const timeoutId = setTimeout(() => {
        validateCompanyName(data.companyName.trim())
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setCompanyNameValidation({
        isValidating: false,
        isAvailable: null,
        message: ''
      })
    }
  }, [data.companyName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canGoNext && companyNameValidation.isAvailable) {
      onNext()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          We'll use this information to set up your GuideLayer AI organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              type="text"
              value={data.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              placeholder="Enter your company name"
              required
              maxLength={MAX_COMPANY_NAME_LENGTH}
            />
            {companyNameValidation.isValidating && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {companyNameValidation.message && !companyNameValidation.isValidating && (
              <Alert variant={companyNameValidation.isAvailable ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {companyNameValidation.isAvailable ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{companyNameValidation.message}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry *</Label>
            <Select value={data.industry} onValueChange={(value) => onUpdate({ industry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size *</Label>
            <Select value={data.teamSize} onValueChange={(value) => onUpdate({ teamSize: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your team size" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={!canGoNext || !companyNameValidation.isAvailable}
            >
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 