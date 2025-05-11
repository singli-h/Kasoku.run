"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from '@clerk/nextjs'
import useSWRImmutable from 'swr/immutable'
import GroupListView from './GroupListView'
import GroupEditorView from './GroupEditorView'
import { Loader2 } from 'lucide-react'

// Unified fetcher for SWR that handles array keys [url, token]
const fetcher = async (key) => {
  let url, token;
  if (Array.isArray(key)) {
    [url, token] = key;
  } else if (typeof key === 'string' && key.includes(',')) {
    // handle serialized array key: 'url,token'
    [url, token] = key.split(',', 2);
  } else {
    url = key;
  }
  
  if (!token) {
    console.warn('No token available for API request:', url);
    throw new Error('Authentication token not available');
  }
  
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    const res = await fetch(url, { 
      headers,
      credentials: 'include' 
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`API error (${res.status}):`, errorText);
      throw new Error(`API request failed: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}

export default function PresetGroupBuilder({ userRole }) {
  const { session, isLoaded, isSignedIn } = useSession()
  const [token, setToken] = useState(null)
  const [selectedGroupId, setSelectedGroupId] = useState(null)

  // Get auth token
  useEffect(() => {
    if (session) session.getToken().then(setToken)
  }, [session])

  // Fetch list of groups
  const { data: listBody, error: listError, mutate: mutateList } = useSWRImmutable(
    token ? ['/api/plans/preset-groups', token] : null,
    fetcher
  )
  const groups = listBody?.data?.groups || []

  // Fetch all exercises for builder
  const { data: exBody, error: exError } = useSWRImmutable(
    token ? ['/api/plans/exercises', token] : null,
    fetcher
  )
  const filteredExercises = exBody?.data?.exercises || []
  const loadingExercises = !exBody && !exError

  // Fetch single group detail when selected
  const { data: detailBody, error: detailError, mutate: mutateDetail } = useSWRImmutable(
    selectedGroupId && token ? [`/api/plans/preset-groups/${selectedGroupId}`, token] : null,
    fetcher
  )
  const groupDetail = detailBody?.data || null

  // Loading states
  if (!listBody && !listError) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
  if (listError) return <div className="text-red-500">Error loading groups: {listError.message}</div>

  // If single group selected and exercises loading
  if (selectedGroupId && loadingExercises) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
  if (selectedGroupId && exError) return <div className="text-red-500">Error loading exercises: {exError.message}</div>

  // If no group selected, show list
  if (!selectedGroupId) {
    return (
      <GroupListView
        groups={groups}
        onSelect={(id) => setSelectedGroupId(id)}
        onNew={async () => {
          // create new group
          const res = await fetch('/api/plans/preset-groups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'New Group' })
          })
          const json = await res.json()
          if (json.status === 'success') {
            mutateList() // refresh list
            setSelectedGroupId(json.data.group.id)
          }
        }}
      />
    )
  }

  // If detail loading
  if (!detailBody && !detailError) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
  if (detailError) return <div className="text-red-500">Error loading group: {detailError.message}</div>

  // Show editor view
  return (
    <GroupEditorView
      group={groupDetail.group}
      presets={groupDetail.presets}
      onBack={() => setSelectedGroupId(null)}
      onSave={async (updateData) => {
        // update group via PUT
        await fetch(`/api/plans/preset-groups/${selectedGroupId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        })
        mutateDetail()
        mutateList()
        setSelectedGroupId(null)
      }}
    />
  )
} 