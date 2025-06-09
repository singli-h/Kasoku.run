"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MAX_TEAM_INVITES } from '../constants'
import type { OrganizationWizardData, TeamMemberInvite } from '../types'

interface TeamPlanningStepProps {
  data: OrganizationWizardData
  onAddTeamMember: (member: TeamMemberInvite) => void
  onRemoveTeamMember: (index: number) => void
  onUpdateTeamMember: (index: number, updates: Partial<TeamMemberInvite>) => void
  onNext: () => void
  onPrevious: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export function TeamPlanningStep({
  data,
  onAddTeamMember,
  onRemoveTeamMember,
  onUpdateTeamMember,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious
}: TeamPlanningStepProps) {
  const [newMember, setNewMember] = useState<TeamMemberInvite>({
    email: '',
    role: 'client_team',
    name: ''
  })

  const [emailError, setEmailError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddMember = () => {
    if (!newMember.email.trim()) {
      setEmailError('Email is required')
      return
    }

    if (!validateEmail(newMember.email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    if (data.teamMembers.some(member => member.email === newMember.email)) {
      setEmailError('This email has already been added')
      return
    }

    if (data.teamMembers.length >= MAX_TEAM_INVITES) {
      setEmailError(`Maximum ${MAX_TEAM_INVITES} team members allowed for MVP`)
      return
    }

    onAddTeamMember(newMember)
    setNewMember({ email: '', role: 'client_team', name: '' })
    setEmailError('')
  }

  const handleEmailChange = (email: string) => {
    setNewMember(prev => ({ ...prev, email }))
    if (emailError) setEmailError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canGoNext) {
      onNext()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite your team
        </CardTitle>
        <CardDescription>
          Add team members who will join your organization. You can skip this step and invite people later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add new team member form */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-4">Add team member</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberEmail">Email *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="colleague@company.com"
                />
                {emailError && (
                  <p className="text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberName">Name (optional)</Label>
                <Input
                  id="memberName"
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberRole">Role</Label>
                <Select 
                  value={newMember.role} 
                  onValueChange={(role: 'client_admin' | 'client_team') => 
                    setNewMember(prev => ({ ...prev, role }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_team">Team Member</SelectItem>
                    <SelectItem value="client_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddMember}
              className="mt-4"
              disabled={data.teamMembers.length >= MAX_TEAM_INVITES}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {/* Team members list */}
          {data.teamMembers.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Team members to invite ({data.teamMembers.length})</h4>
              <div className="space-y-2">
                {data.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{member.email}</p>
                          {member.name && (
                            <p className="text-sm text-muted-foreground">{member.name}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {member.role === 'client_admin' ? 'Admin' : 'Team Member'}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveTeamMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.teamMembers.length === 0 && (
            <Alert>
              <AlertDescription>
                No team members added yet. You can skip this step and invite people after creating your organization.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onPrevious}
              disabled={!canGoPrevious}
            >
              Previous
            </Button>
            <Button type="submit" disabled={!canGoNext}>
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 