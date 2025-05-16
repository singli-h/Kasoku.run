"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pencil, Plus, Search } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function GroupListView({ groups, onNew }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const handleEdit = (groupId) => {
    router.push(`/preset-groups/${groupId}/edit`)
  }

  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Preset Groups</h2>
        <Button onClick={onNew} size="lg">
          <Plus className="mr-2 h-5 w-5" /> Create New Preset Group
        </Button>
      </div>

      <div className="mb-6">
        <Label htmlFor="search-groups" className="sr-only">Search Preset Groups</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input 
            id="search-groups"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-1/2 lg:w-1/3 h-11 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No groups match your search' : 'No preset groups yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try a different search term or clear the search.' : 'Get started by creating a new preset group.'}
            </p>
            {!searchTerm && (
              <Button onClick={onNew}>
                <Plus className="mr-2 h-5 w-5" /> Create First Preset Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroups.map(group => (
            <Card key={group.id} className="hover:shadow-xl transition-all duration-300 ease-in-out rounded-lg overflow-hidden flex flex-col">
              <CardHeader className="bg-gray-50 p-4 border-b">
                <CardTitle className="truncate text-lg font-semibold text-gray-800">{group.name || 'Untitled Group'}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow space-y-3">
                <p className="text-sm text-gray-600">Mode: <span className="font-medium text-gray-700">{group.session_mode || 'N/A'}</span></p>
                {group.date && <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-700">{new Date(group.date).toLocaleDateString()}</span></p>}
                <div className="mt-auto pt-3">
                  <Button size="sm" onClick={() => handleEdit(group.id)} className="w-full bg-primary hover:bg-primary-dark text-white">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 