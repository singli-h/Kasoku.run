"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddAthleteDialog({ groupId, onClose }) {
  const [athleteName, setAthleteName] = useState('')

  const handleAdd = () => {
    // TODO: implement API call to add athlete to group
    console.log('Adding athlete:', athleteName, 'to group', groupId)
    setAthleteName('')
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Athlete</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                placeholder="Athlete name"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                autoFocus
              />
            </div>
            <Button onClick={handleAdd} disabled={!athleteName.trim()}>
              Add
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 