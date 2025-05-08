"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Search, Filter, MessageSquare, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddAthleteDialog } from '@/components/athletes/AddAthleteDialog'
import { useToast } from '@/components/ui/toast'

/**
 * AthletesList renders grid and table views of athletes with search and filter functionality.
 * @param {{ athletes: Array, groups: Array, onAdd: Function, onRemove: Function }} props
 */
export default function AthletesList({ athletes, groups, onAdd, onRemove }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [view, setView] = useState('grid')
  const { toast } = useToast()

  // Filter logic
  const filtered = athletes.filter((athlete) => {
    const name = `${athlete.user.first_name} ${athlete.user.last_name}`
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || athlete.group.group_name === selectedGroup
    const matchesStatus = selectedStatus === 'all' || athlete.status === selectedStatus
    return matchesSearch && matchesGroup && matchesStatus
  })

  const groupNames = ['all', ...groups.map(g => g.group_name)]

  // Handler to remove athlete from group
  const handleRemove = async (athleteId) => {
    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ athlete_group_id: null, notes: 'Removed from group' })
      })
      const json = await res.json()
      if (res.ok && json.status === 'success') {
        onRemove?.(athleteId)
        toast({ title: 'Removed', description: 'Athlete removed from group', variant: 'success', duration: 3000 })
      } else {
        toast({ title: 'Error', description: json.message || 'Failed to remove', variant: 'destructive', duration: 3000 })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'Network error', variant: 'destructive', duration: 3000 })
    }
    setMenuOpenId(null)
  }

  return (
    <div className="space-y-4">
      {/* Search and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search athletes..." className="w-full pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="relative">
            <Button variant="outline" size="icon" onClick={() => setFilterOpen(o => !o)}>
              <Filter className="h-4 w-4" />
            </Button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-[200px] bg-white shadow-lg rounded-md z-50 divide-y divide-gray-100">
                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Group</p>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {['all', ...groups.map(g => g.group_name)].map(name => (
                        <SelectItem key={name} value={name}>{name === 'all' ? 'All Groups' : name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Status</p>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" /> Message All
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Athlete
          </Button>
        </div>
      </div>

      {/* View toggles */}
      <Tabs value={view} onValueChange={setView} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">{filtered.length} athletes</p>
        </div>

        <TabsContent value="grid" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((athlete) => (
              <Card key={athlete.id} className="overflow-hidden border border-gray-200 rounded-lg">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={athlete.user.avatar_url || '/placeholder.svg'} alt={athlete.user.first_name} />
                        <AvatarFallback>{athlete.user.first_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          <Link href={`/athletes/${athlete.id}`} className="hover:underline">{athlete.user.first_name} {athlete.user.last_name}</Link>
                        </CardTitle>
                        <CardDescription className="text-xs">{athlete.group.group_name}</CardDescription>
                      </div>
                    </div>
                    <div className="relative inline-block text-left">
                      <Button variant="ghost" size="icon" onClick={() => setMenuOpenId(menuOpenId === athlete.id ? null : athlete.id)}>
                        <MoreHorizontal />
                      </Button>
                      {menuOpenId === athlete.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 rounded-md">
                          <div className="py-1">
                            <Link href={`/athletes/${athlete.id}`} onClick={() => setMenuOpenId(null)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Profile</Link>
                            <button type="button" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Details</button>
                            <button type="button" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Message</button>
                            <div className="border-t border-gray-200 my-1" />
                            <button type="button" className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100" onClick={() => handleRemove(athlete.id)}>Remove Athlete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Height:</span><span className="text-xs">{athlete.height} m</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Weight:</span><span className="text-xs">{athlete.weight} kg</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Status:</span><Badge variant="outline" className="font-normal">{athlete.status}</Badge></div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/40 p-4">
                  <div className="grid w-full gap-1">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Goals:</span><span className="text-xs truncate max-w-[150px]">{athlete.training_goals}</span></div>
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Experience:</span><span className="text-xs">{athlete.experience}</span></div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <div className="rounded-md border overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Athlete</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Group</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Height</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Weight</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((athlete) => (
                  <tr key={athlete.id} className="border-b hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={athlete.user.avatar_url || '/placeholder.svg'} /><AvatarFallback>{athlete.user.first_name.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                          <Link href={`/athletes/${athlete.id}`} className="font-medium hover:underline">{athlete.user.first_name} {athlete.user.last_name}</Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-normal">{athlete.group.group_name}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-normal">{athlete.status}</Badge></td>
                    <td className="px-4 py-3 text-sm">{athlete.height} m</td>
                    <td className="px-4 py-3 text-sm">{athlete.weight} kg</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <Button variant="ghost" size="icon" onClick={() => setMenuOpenId(menuOpenId === athlete.id ? null : athlete.id)}>
                          <MoreHorizontal />
                        </Button>
                        {menuOpenId === athlete.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 rounded-md">
                            <div className="py-1">
                              <Link href={`/athletes/${athlete.id}`} onClick={() => setMenuOpenId(null)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Profile</Link>
                              <button type="button" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Details</button>
                              <button type="button" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Message</button>
                              <div className="border-t border-gray-200 my-1" />
                              <button type="button" className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100" onClick={() => handleRemove(athlete.id)}>Remove Athlete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      <AddAthleteDialog open={isAddOpen} onOpenChange={setIsAddOpen} groups={groups} onAdd={onAdd} />
    </div>
  )
} 