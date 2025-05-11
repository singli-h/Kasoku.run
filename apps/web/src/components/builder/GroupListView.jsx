"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Pencil, Plus } from 'lucide-react'

export default function GroupListView({ groups, onSelect, onNew }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Preset Groups</h2>
        <Button onClick={onNew} variant="outline">
          <Plus className="mr-2" /> New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <p>You have not created any preset groups yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="truncate">{group.name || 'Untitled Group'}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-2">
                <p className="text-sm text-gray-600 truncate">Date: {group.date || '-'}</p>
                <p className="text-sm text-gray-600">Mode: {group.session_mode}</p>
                <Button size="sm" onClick={() => onSelect(group.id)} className="mt-2">
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 