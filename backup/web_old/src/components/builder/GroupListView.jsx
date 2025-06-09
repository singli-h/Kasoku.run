"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Plus, Search, XCircle, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function GroupListView({ 
  allGroups,
  onNew,
  nameFilter,
  setNameFilter,
  microcycleIdFilter,
  setMicrocycleIdFilter,
  athleteGroupIdFilter,
  setAthleteGroupIdFilter,
  sessionModeFilter,
  setSessionModeFilter,
  isLoading
}) {
  const router = useRouter()

  const handleEdit = (groupId) => {
    router.push(`/preset-groups/${groupId}/edit`)
  }

  const clearFilters = () => {
    setNameFilter('');
    setMicrocycleIdFilter('');
    setAthleteGroupIdFilter('');
    setSessionModeFilter('');
  };

  const filteredGroups = React.useMemo(() => {
    if (!allGroups) return [];
    return allGroups.filter(group => {
      const nameMatch = nameFilter 
        ? group.name?.toLowerCase().includes(nameFilter.toLowerCase())
        : true;
      const microcycleMatch = microcycleIdFilter 
        ? group.microcycle_id?.toString() === microcycleIdFilter
        : true;
      const athleteGroupMatch = athleteGroupIdFilter 
        ? group.athlete_group_id?.toString() === athleteGroupIdFilter
        : true;
      const sessionModeMatch = (sessionModeFilter && sessionModeFilter !== '_all_')
        ? group.session_mode === sessionModeFilter
        : true;
      return nameMatch && microcycleMatch && athleteGroupMatch && sessionModeMatch;
    });
  }, [allGroups, nameFilter, microcycleIdFilter, athleteGroupIdFilter, sessionModeFilter]);

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Preset Groups</h2>
        <Button onClick={onNew} size="lg" className="w-full md:w-auto">
          <Plus className="mr-2 h-5 w-5" /> Create New Preset Group
        </Button>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="name-filter" className="text-sm font-medium">Name</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="name-filter"
                  type="text"
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-10 h-10 rounded-md"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="microcycle-id-filter" className="text-sm font-medium">Microcycle ID</Label>
              <Input 
                id="microcycle-id-filter"
                type="text"
                placeholder="Enter Microcycle ID..."
                value={microcycleIdFilter}
                onChange={(e) => setMicrocycleIdFilter(e.target.value)}
                className="mt-1 h-10 rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="athlete-group-id-filter" className="text-sm font-medium">Athlete Group ID</Label>
              <Input 
                id="athlete-group-id-filter"
                type="text"
                placeholder="Enter Athlete Group ID..."
                value={athleteGroupIdFilter}
                onChange={(e) => setAthleteGroupIdFilter(e.target.value)}
                className="mt-1 h-10 rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="session-mode-filter" className="text-sm font-medium">Session Mode</Label>
              <Select value={sessionModeFilter} onValueChange={setSessionModeFilter}>
                <SelectTrigger className="w-full mt-1 h-10 rounded-md">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">All Modes</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters} size="sm">
              <XCircle className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-gray-600">Loading initial group list...</p>
        </div>
      )}

      {!isLoading && filteredGroups.length === 0 ? (
        <Card className="text-center py-10 shadow-sm">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {nameFilter || microcycleIdFilter || athleteGroupIdFilter || (sessionModeFilter && sessionModeFilter !== '_all_') 
                ? 'No groups match your filters' 
                : 'No preset groups yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {nameFilter || microcycleIdFilter || athleteGroupIdFilter || (sessionModeFilter && sessionModeFilter !== '_all_') 
                ? 'Try adjusting or clearing your filters.' 
                : 'Get started by creating a new preset group.'}
            </p>
            {!(nameFilter || microcycleIdFilter || athleteGroupIdFilter || (sessionModeFilter && sessionModeFilter !== '_all_')) && (
              <Button onClick={onNew}>
                <Plus className="mr-2 h-5 w-5" /> Create First Preset Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroups.map(group => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden flex flex-col bg-white">
              <CardHeader className="bg-slate-50 p-4 border-b">
                <CardTitle className="truncate text-lg font-semibold text-slate-800">{group.name || 'Untitled Group'}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow space-y-2 text-sm">
                <p className="text-slate-600">Mode: <span className="font-medium text-slate-700 capitalize">{group.session_mode || 'N/A'}</span></p>
                {group.date && <p className="text-slate-600">Date: <span className="font-medium text-slate-700">{new Date(group.date + 'T00:00:00').toLocaleDateString()}</span></p>}
                {group.microcycle_id && <p className="text-slate-600">Microcycle ID: <span className="font-medium text-slate-700">{group.microcycle_id}</span></p>}
                {group.athlete_group_id && <p className="text-slate-600">Athlete Group ID: <span className="font-medium text-slate-700">{group.athlete_group_id}</span></p>}
                {group.description && <p className="text-slate-500 text-xs mt-1 truncate" title={group.description}>Desc: {group.description}</p>}
              </CardContent>
              <div className="p-4 pt-2 mt-auto">
                  <Button size="sm" onClick={() => handleEdit(group.id)} className="w-full bg-primary hover:bg-primary/90 text-white">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Group
                  </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 