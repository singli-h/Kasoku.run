"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Flag } from "lucide-react"

interface Event {
  id: number
  name: string | null
  category: string | null
  type: string | null
  created_at: string | null
  updated_at: string | null
}

interface RaceDayManagerProps {
  events: Event[]
}

export function RaceDayManager({ events }: RaceDayManagerProps) {
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })
  }

  const getEventIcon = (category: string | null) => {
    switch (category) {
      case "competition":
        return "🏆"
      default:
        return "🏃"
    }
  }

  const getEventTypeLabel = (category: string | null) => {
    switch (category) {
      case "competition":
        return "Major Race"
      default:
        return "Normal Race"
    }
  }

  const getEventTypeColor = (category: string | null) => {
    switch (category) {
      case "competition":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Race Days</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={editingMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditingMode(editingMode === 'edit' ? 'view' : 'edit')}
            >
              <Edit className="h-3 w-3 mr-1" />
              {editingMode === 'edit' ? 'Done' : 'Edit'}
            </Button>
            {editingMode === 'edit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Race
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${getEventTypeColor(event.category)}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getEventIcon(event.category)}</span>
                <div>
                  <div className="font-medium text-sm">{event.name}</div>
                  <div className="text-xs opacity-80">
                    {formatDate(event.created_at)} • {getEventTypeLabel(event.category)}
                  </div>
                </div>
              </div>
              {editingMode === 'edit' && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEvent(event)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // TODO: Delete event
                      console.log('Delete event:', event.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No race days added</div>
              <div className="text-xs">Click "Add Race" to add your first race</div>
            </div>
          )}
        </div>

        {/* Add Race Form */}
        {showAddForm && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Race Day</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Race Name</Label>
                  <Input
                    placeholder="e.g., Fall Championship Finals"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Race Date</Label>
                  <Input
                    type="date"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Race Type</Label>
                  <Select>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select race type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major">🏆 Major Race</SelectItem>
                      <SelectItem value="normal">🏃 Normal Race</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs">
                    Add Race
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Race Form */}
        {editingEvent && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Edit Race Day</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Race Name</Label>
                  <Input
                    defaultValue={editingEvent.name || ''}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Race Date</Label>
                  <Input
                    type="date"
                    defaultValue={editingEvent.created_at?.split('T')[0] || ''}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Race Type</Label>
                  <Select defaultValue={editingEvent.category || 'normal'}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select race type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competition">🏆 Major Race</SelectItem>
                      <SelectItem value="normal">🏃 Normal Race</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEvent(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
