"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Mail, CheckCircle } from 'lucide-react'
import { INDUSTRY_OPTIONS, TEAM_SIZE_OPTIONS } from '../constants'
import type { OrganizationWizardData } from '../types'

interface ReviewStepProps {
  data: OrganizationWizardData
  onPrevious: () => void
  onSubmit: () => void
  canGoPrevious: boolean
  isSubmitting: boolean
}

export function ReviewStep({ 
  data, 
  onPrevious, 
  onSubmit, 
  canGoPrevious, 
  isSubmitting 
}: ReviewStepProps) {
  const industryLabel = INDUSTRY_OPTIONS.find(option => option.value === data.industry)?.label
  const teamSizeLabel = TEAM_SIZE_OPTIONS.find(option => option.value === data.teamSize)?.label

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Review & Create Organization
        </CardTitle>
        <CardDescription>
          Please review your information before creating your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Details Summary */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4" />
              <h4 className="font-medium">Business Details</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company Name:</span>
                <span className="font-medium">{data.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-medium">{industryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team Size:</span>
                <span className="font-medium">{teamSizeLabel}</span>
              </div>
            </div>
          </div>

          {/* Team Members Summary */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <h4 className="font-medium">Team Members</h4>
              <Badge variant="secondary">{data.teamMembers.length}</Badge>
            </div>
            
            {data.teamMembers.length > 0 ? (
              <div className="space-y-3">
                {data.teamMembers.map((member, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{member.email}</p>
                        {member.name && (
                          <p className="text-sm text-muted-foreground">{member.name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={member.role === 'client_admin' ? 'default' : 'secondary'}>
                      {member.role === 'client_admin' ? 'Admin' : 'Team Member'}
                    </Badge>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground mt-3">
                  Invitations will be sent to these team members after your organization is created.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No team members to invite. You can add team members later from your organization settings.
              </p>
            )}
          </div>

          {/* What happens next */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your organization "{data.companyName}" will be created</li>
              <li>• You'll be assigned as the organization administrator</li>
              {data.teamMembers.length > 0 && (
                <li>• Invitation emails will be sent to your team members</li>
              )}
              <li>• You'll be redirected to your organization dashboard</li>
            </ul>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onPrevious}
              disabled={!canGoPrevious || isSubmitting}
            >
              Previous
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 