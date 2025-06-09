/*
<ai_context>
Section manager component for organizing training sessions into sections.
Based on the exerciseSectionManager patterns from the original Kasoku web_old system.
Handles drag-and-drop reordering, section management, and exercise organization.
</ai_context>
*/

"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MoreVertical, 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3,
  Check,
  X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SectionItem {
  id: string
  name: string
  type?: string
  description?: string
  order: number
}

interface Section {
  id: string
  name: string
  items: SectionItem[]
  color?: string
  collapsible?: boolean
  collapsed?: boolean
}

interface SectionManagerProps {
  sections: Section[]
  onSectionAdd?: (name: string) => void
  onSectionDelete?: (sectionId: string) => void
  onSectionRename?: (sectionId: string, newName: string) => void
  onSectionReorder?: (sectionIds: string[]) => void
  onItemAdd?: (sectionId: string, item: Omit<SectionItem, 'id'>) => void
  onItemDelete?: (sectionId: string, itemId: string) => void
  onItemMove?: (itemId: string, fromSectionId: string, toSectionId: string, newOrder: number) => void
  onItemReorder?: (sectionId: string, itemIds: string[]) => void
  renderItem?: (item: SectionItem, sectionId: string) => React.ReactNode
  emptyStateMessage?: string
  addSectionLabel?: string
  addItemLabel?: string
  className?: string
}

export function SectionManager({
  sections,
  onSectionAdd,
  onSectionDelete,
  onSectionRename,
  onSectionReorder,
  onItemAdd,
  onItemDelete,
  onItemMove,
  onItemReorder,
  renderItem,
  emptyStateMessage = "No sections created yet",
  addSectionLabel = "Add Section",
  addItemLabel = "Add Item",
  className = ""
}: SectionManagerProps) {
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState("")

  const handleAddSection = () => {
    if (newSectionName.trim() && onSectionAdd) {
      onSectionAdd(newSectionName.trim())
      setNewSectionName("")
      setIsAddingSection(false)
    }
  }

  const handleStartEdit = (section: Section) => {
    setEditingSection(section.id)
    setEditingSectionName(section.name)
  }

  const handleSaveEdit = () => {
    if (editingSection && editingSectionName.trim() && onSectionRename) {
      onSectionRename(editingSection, editingSectionName.trim())
    }
    setEditingSection(null)
    setEditingSectionName("")
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditingSectionName("")
  }

  const defaultRenderItem = (item: SectionItem, sectionId: string) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md group">
      <div className="flex items-center space-x-3">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        <div>
          <p className="font-medium">{item.name}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        {item.type && (
          <Badge variant="secondary" className="text-xs">
            {item.type}
          </Badge>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onItemDelete?.(sectionId, item.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  if (sections.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{emptyStateMessage}</p>
          <Button onClick={() => setIsAddingSection(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {addSectionLabel}
          </Button>
        </div>
        
        {isAddingSection && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Section name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection()
                    if (e.key === 'Escape') setIsAddingSection(false)
                  }}
                  autoFocus
                />
                <Button size="icon" onClick={handleAddSection}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => setIsAddingSection(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                
                {editingSection === section.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="text-lg font-semibold"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <CardTitle className="flex items-center space-x-2">
                    {section.name}
                    <Badge variant="outline" className="text-xs">
                      {section.items.length} items
                    </Badge>
                  </CardTitle>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStartEdit(section)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onSectionDelete?.(section.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {section.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in this section</p>
                {onItemAdd && (
                  <Button 
                    variant="ghost" 
                    className="mt-2"
                    onClick={() => onItemAdd(section.id, { name: 'New Item', order: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addItemLabel}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {section.items
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <div key={item.id}>
                      {renderItem ? renderItem(item, section.id) : defaultRenderItem(item, section.id)}
                    </div>
                  ))}
                
                {onItemAdd && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onItemAdd(section.id, { 
                      name: 'New Item', 
                      order: section.items.length 
                    })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addItemLabel}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setIsAddingSection(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        {addSectionLabel}
      </Button>
      
      {isAddingSection && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection()
                  if (e.key === 'Escape') setIsAddingSection(false)
                }}
                autoFocus
              />
              <Button size="icon" onClick={handleAddSection}>
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => setIsAddingSection(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 