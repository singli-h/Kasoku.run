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
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
  return res.json();
}

export default function PresetGroupBuilder({ userRole }) {
  const { session, isLoaded, isSignedIn } = useSession()
  const [token, setToken] = useState(null)

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

  // Loading states
  if (!listBody && !listError && !token) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
  }
  if (listError) return <div className="text-red-500">Error loading groups: {listError.message}</div>

  // Show the list view. Navigation to editor is handled by GroupListView and the new page.
  return (
    <GroupListView
      groups={groups}
      onNew={async () => {
        if (!token) {
          console.error("No auth token available for creating new group.");
          // Optionally, show a user-facing error/toast
          return;
        }
        try {
          const res = await fetch('/api/plans/preset-groups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'New Preset Group' }) // Default name
          });
          const json = await res.json();
          if (json.status === 'success' && json.data?.group?.id) {
            mutateList(); // refresh list
            // Optionally, navigate to the edit page for the new group
            // router.push(`/preset-groups/${json.data.group.id}/edit`); 
          } else {
            console.error("Failed to create new group or missing ID:", json.message || json);
            // Show error to user
          }
        } catch (error) {
          console.error("Error creating new group:", error);
          // Show error to user
        }
      }}
    />
  );
} 