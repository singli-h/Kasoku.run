"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from '@clerk/nextjs'
import useSWRImmutable from 'swr/immutable'
import GroupListView from './GroupListView'
import { Loader2 } from 'lucide-react'

// Unified fetcher for SWR that handles array keys [url, token, params]
const fetcher = async (key) => {
  let url, token, params;
  if (Array.isArray(key)) {
    [url, token, params] = key;
  } else {
    // Fallback for simple string key, though array is preferred for this component
    url = key;
    token = null;
    params = {};
  }

  const queryParams = new URLSearchParams(params).toString();
  const fullUrl = queryParams ? `${url}?${queryParams}` : url;

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(fullUrl, { headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || `Network response was not ok: ${res.status}`);
  }
  return res.json();
}

export default function PresetGroupBuilder({ userRole }) {
  const { session } = useSession()
  const [token, setToken] = useState(null)

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [microcycleIdFilter, setMicrocycleIdFilter] = useState('');
  const [athleteGroupIdFilter, setAthleteGroupIdFilter] = useState('');
  const [sessionModeFilter, setSessionModeFilter] = useState(''); // e.g., 'individual', 'group', or '' for all

  useEffect(() => {
    if (session) session.getToken().then(setToken)
  }, [session])

  const buildSWRKey = useCallback(() => {
    if (!token) return null;
    const params = {};
    if (nameFilter) params.name = nameFilter;
    if (microcycleIdFilter) params.microcycleId = microcycleIdFilter;
    if (athleteGroupIdFilter) params.athleteGroupId = athleteGroupIdFilter;
    // Only add sessionMode to params if it's a specific filter value ('individual' or 'group')
    // Treat '' (empty string, initial/cleared) and '_all_' (explicitly selected "All Modes" option) as no filter.
    if (sessionModeFilter && sessionModeFilter !== '_all_') { 
      params.sessionMode = sessionModeFilter;
    }
    return ['/api/plans/preset-groups', token, params];
  }, [token, nameFilter, microcycleIdFilter, athleteGroupIdFilter, sessionModeFilter]);

  const { data: listBody, error: listError, mutate: mutateList } = useSWRImmutable(
    buildSWRKey(),
    fetcher
  )
  const groups = listBody?.data?.groups || []

  if (!token) { // Simplified loading: wait for token first
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /> Initializing...</div>
  }

  // Loading state for SWR fetch after token is available
  if (!listBody && !listError && token) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /> Loading groups...</div>
  }

  if (listError) return <div className="text-red-500 p-4 rounded-md bg-red-50 border border-red-200">Error loading groups: {listError.message}</div>

  return (
    <GroupListView
      groups={groups}
      nameFilter={nameFilter}
      setNameFilter={setNameFilter}
      microcycleIdFilter={microcycleIdFilter}
      setMicrocycleIdFilter={setMicrocycleIdFilter}
      athleteGroupIdFilter={athleteGroupIdFilter}
      setAthleteGroupIdFilter={setAthleteGroupIdFilter}
      sessionModeFilter={sessionModeFilter}
      setSessionModeFilter={setSessionModeFilter}
      isLoading={!listBody && !listError} // Pass loading state for groups
      onNew={async () => {
        if (!token) {
          console.error("No auth token available for creating new group.");
          // Optionally, show a user-facing error/toast
          return;
        }
        try {
          // For new group, ensure date is set if DB requires it, or API handles default
          // API currently makes date nullable on insert, which is fine based on its code.
          const res = await fetch('/api/plans/preset-groups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            // Ensure POST body contains required fields, like 'name'. 'date' is optional in API docs for POST.
            // API sets default 'session_mode' if not provided.
            body: JSON.stringify({ 
              name: 'New Preset Group - ' + new Date().toLocaleTimeString(), // More unique default name
              date: new Date().toISOString().split('T')[0], // Default to today's date, API POST expects string
              session_mode: 'individual' // Default explicitly
            }) 
          });
          const json = await res.json();
          if (json.status === 'success' && json.data?.group?.id) {
            mutateList(); // refresh list
          } else {
            console.error("Failed to create new group or missing ID:", json.message || json);
            alert(`Failed to create group: ${json.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error("Error creating new group:", error);
          alert(`Error creating group: ${error.message}`);
        }
      }}
    />
  );
} 