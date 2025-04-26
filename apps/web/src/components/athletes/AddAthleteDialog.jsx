"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'

export function AddAthleteDialog({ open, onOpenChange, groups, onAdd }) {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [groupId, setGroupId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    // Validate input
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!groupId) {
      setError('Please select a group')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, athleteGroupId: groupId, message })
      })
      const json = await res.json()
      
      if (!res.ok || json.status === 'error') {
        setError(json.message || 'An error occurred')
      } else {
        // Notify parent of new athlete
        onAdd?.(json.data)
        toast({
          title: "Success",
          description: "Athlete added to group",
          variant: "success",
          duration: 3000
        })
        onOpenChange(false)
        resetForm()
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setGroupId('')
    setMessage('')
    setError('')
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Athlete</DialogTitle>
          <DialogDescription>Add a new athlete to your coaching roster.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="athlete@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The athlete must already have an account in the system.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Assign to Group <span className="text-red-500">*</span></Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.group_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Notes (Optional)</Label>
            <textarea
              id="message"
              className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Add notes about this group assignment..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-medium mt-2">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Athlete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 