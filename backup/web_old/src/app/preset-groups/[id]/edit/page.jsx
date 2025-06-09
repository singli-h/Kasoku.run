'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import useSWRImmutable from 'swr/immutable'
import GroupEditorView from '@/components/builder/GroupEditorView'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Unified fetcher for SWR that handles array keys [url, token] or string 'url,token'
const fetcher = async (key) => {
  let url, token;
  if (Array.isArray(key)) {
    [url, token] = key;
  } else if (typeof key === 'string' && key.includes(',')) {
    [url, token] = key.split(',', 2);
  } else {
    url = key; // Assume key is just the URL if no token part
  }
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Error fetching ${url}: ${res.status}`, errorBody);
    throw new Error(`Network response was not ok: ${res.status} for ${url}. Body: ${errorBody}`);
  }
  return res.json();
};

export default function PresetGroupEditPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id;
  const { session } = useSession();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (session) {
      session.getToken().then(setToken);
    }
  }, [session]);

  // Fetch all exercises for the editor
  const { 
    data: exercisesData, 
    error: exercisesError, 
    isLoading: exercisesLoading 
  } = useSWRImmutable(
    token ? ['/api/plans/exercises', token] : null, 
    fetcher
  );
  const allExercises = exercisesData?.data?.exercises || [];

  // Fetch the specific preset group details
  const { 
    data: groupDetailData, 
    error: groupDetailError, 
    isLoading: groupDetailLoading,
    mutate: mutateGroupDetail
  } = useSWRImmutable(
    groupId && token ? [`/api/plans/preset-groups/${groupId}`, token] : null, 
    fetcher
  );
  const groupToEdit = groupDetailData?.data?.group;
  const groupPresets = groupDetailData?.data?.presets || [];


  if (!token || exercisesLoading || groupDetailLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (exercisesError) {
    return <div className="text-red-500 p-4">Error loading exercises: {exercisesError.message}</div>;
  }
  if (groupDetailError) {
    return <div className="text-red-500 p-4">Error loading preset group details: {groupDetailError.message}</div>;
  }
  
  if (!groupToEdit) {
     return <div className="text-red-500 p-4">Preset group not found or failed to load.</div>;
  }

  const handleSaveChanges = async (updatedData) => {
    if (!groupId || !token) return;
    try {
      const res = await fetch(`/api/plans/preset-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to save preset group');
      }
      await mutateGroupDetail(); // Revalidate the local SWR cache for group details
      router.push('/preset-groups'); // Navigate back to preset groups main page
    } catch (error) {
      console.error("Failed to save preset group:", error);
      // Here you would typically show a toast notification to the user
      alert(`Error saving: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => router.push('/preset-groups')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Preset Groups
      </Button>
      <GroupEditorView
        group={groupToEdit}
        presets={groupPresets}
        filteredExercises={allExercises} // These are all available exercises
        loadingExercises={exercisesLoading}
        onBack={() => router.push('/preset-groups')}
        onSave={handleSaveChanges}
      />
    </div>
  );
} 