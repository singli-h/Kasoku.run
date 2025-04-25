import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit3, Trash2, Check, X } from 'lucide-react'

export function GroupManagerDialog({ open, onOpenChange, groups, setGroups }) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/athlete-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ group_name: newName.trim() })
      })
      const json = await res.json()
      if (!res.ok || json.status === 'error') {
        setError(json.message || 'Failed to add group')
      } else {
        setGroups(prev => [...prev, json.data])
        setNewName('')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this group?')) return
    try {
      const res = await fetch(`/api/athlete-groups/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete')
      setGroups(prev => prev.filter(g => g.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const startEdit = (group) => {
    setEditingId(group.id)
    setEditName(group.group_name)
  }

  const handleSave = async (id) => {
    if (!editName.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/athlete-groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ group_name: editName.trim() })
      })
      const json = await res.json()
      if (res.ok && json.status === 'success') {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, group_name: editName.trim() } : g))
        setEditingId(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Manage Athlete Groups</DialogTitle>
          <DialogDescription>Use the form and table below to add, edit, or remove groups.</DialogDescription>
        </DialogHeader>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Input
              id="new-group"
              placeholder="New group name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={loading}>{loading ? 'Adding...' : 'Add Group'}</Button>
          </div>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Group Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id} className="border-b">
                    <td className="px-4 py-2">
                      {editingId === group.id ? (
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <span>{group.group_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      {editingId === group.id ? (
                        <>  
                          <Button variant="ghost" size="icon" onClick={() => handleSave(group.id)}><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>  
                          <Button variant="ghost" size="icon" onClick={() => startEdit(group)}><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GroupManagerDialog 