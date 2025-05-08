import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit3, Trash2, Check, X, AlertCircle, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { AnimatePresence, motion } from 'framer-motion'

export function GroupManagerDialog({ open, onOpenChange, groups, setGroups }) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState(null)
  const inputRef = useRef(null)
  const { toast } = useToast()

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('Please enter a group name')
      inputRef.current?.focus()
      return
    }
    
    if (groups.some(g => g.group_name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('A group with this name already exists')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/athlete-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ group_name: newName.trim() })
      })
      
      const json = await res.json()
      
      if (res.ok && json.status === 'success') {
        setGroups(prev => [...prev, json.data])
        setNewName('')
        toast({
          title: "Success",
          description: "Group created successfully",
          variant: "success",
          duration: 3000
        })
      } else {
        setError(json.message || 'Failed to create group')
      }
    } catch (e) {
      console.error(e)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (group) => {
    setGroupToDelete(group)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!groupToDelete) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/athlete-groups/${groupToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Check if response is 2xx (success)
      if (res.ok) {
        // Special handling for 204 No Content responses
        if (res.status === 204) {
          // For 204 responses, we don't try to parse the JSON
          setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
          toast({
            title: "Success",
            description: "Group deleted successfully",
            variant: "success",
            duration: 3000
          });
        } else {
          // For other success codes, try to parse JSON if available
          let success = true;
          let message = "Group deleted successfully";
          
          try {
            const json = await res.json();
            if (json.status !== 'success') {
              success = false;
              message = json.message || "Failed to delete group";
            }
          } catch (parseError) {
            // If JSON parsing fails but status was OK, we still consider it a success
            console.warn("Could not parse JSON response, but status was OK:", parseError);
          }
          
          if (success) {
            setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
            toast({
              title: "Success",
              description: message,
              variant: "success",
              duration: 3000
            });
          } else {
            toast({
              title: "Warning",
              description: message,
              variant: "warning",
              duration: 3000
            });
          }
        }
      } else {
        // Handle non-OK responses
        let errorMessage = "Failed to delete group";
        
        try {
          const errorJson = await res.json();
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
          errorMessage = `Server error (${res.status})`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (e) {
      console.error("Network or other error:", e);
      toast({
        title: "Error",
        description: "Network error while deleting group",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    }
  }

  // Start editing a group name
  const startEdit = (group) => {
    setEditingId(group.id)
    setEditName(group.group_name)
    // Focus will happen after render via useEffect
    setTimeout(() => {
      const editInput = document.getElementById(`edit-input-${group.id}`)
      editInput?.focus()
    }, 50)
  }

  const handleSave = async (id) => {
    if (!editName.trim()) {
      return
    }
    
    if (groups.some(g => g.id !== id && g.group_name.toLowerCase() === editName.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "A group with this name already exists",
        variant: "destructive",
        duration: 3000
      })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/athlete-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ group_name: editName.trim() })
      })
      
      const json = await res.json()
      
      if (res.ok && json.status === 'success') {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, group_name: editName.trim() } : g))
        setEditingId(null)
        toast({
          title: "Success", 
          description: "Group updated successfully",
          variant: "success",
          duration: 3000
        })
      }
    } catch (e) {
      console.error(e)
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (id) {
        handleSave(id)
      } else {
        handleAdd()
      }
    } else if (e.key === 'Escape' && id) {
      setEditingId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Manage Athlete Groups</DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground">
              Create and organize groups for your athletes.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Input
                  id="new-group"
                  ref={inputRef}
                  placeholder="New group name"
                  value={newName}
                  onChange={e => {
                    setNewName(e.target.value)
                    setError('')
                  }}
                  onKeyDown={e => handleKeyDown(e)}
                  className={`h-10 pr-8 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  disabled={loading}
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "name-error" : undefined}
                />
                {error && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
              <Button 
                onClick={handleAdd} 
                disabled={loading}
                className="h-10 px-4 font-medium"
              >
                {loading ? 'Adding...' : 'Add Group'}
              </Button>
            </div>
            
            {error && (
              <div id="name-error" className="text-sm text-red-500 -mt-4 mb-4 flex items-center gap-1 animate-fadeIn">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="max-h-[280px] overflow-y-auto pr-1 -mr-1">
              <AnimatePresence>
                {groups.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No groups created yet
                  </motion.div>
                ) : (
                  <table className="w-full table-auto">
                    <thead className="sticky top-0 bg-white">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">
                          Group Name
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 w-[100px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(group => (
                        <motion.tr 
                          key={group.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="group"
                        >
                          <td className="py-3 border-t border-muted">
                            {editingId === group.id ? (
                              <Input
                                id={`edit-input-${group.id}`}
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, group.id)}
                                className="h-9"
                              />
                            ) : (
                              <span className="block py-1.5">{group.group_name}</span>
                            )}
                          </td>
                          <td className="py-3 border-t border-muted text-right">
                            {editingId === group.id ? (
                              <div className="flex justify-end space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleSave(group.id)}
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  aria-label="Save changes"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setEditingId(null)}
                                  className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                  aria-label="Cancel editing"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => startEdit(group)}
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  aria-label={`Edit group ${group.group_name}`}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => confirmDelete(group)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  aria-label={`Delete group ${group.group_name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <p className="text-gray-700">
              Are you sure you want to delete the group <span className="font-medium">{groupToDelete?.group_name}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Any athletes assigned to this group will no longer be part of it.
            </p>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              className="sm:w-auto"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              className="sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default GroupManagerDialog 