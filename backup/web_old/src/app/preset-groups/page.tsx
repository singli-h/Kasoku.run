'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit, Trash2, Calendar, Users, User } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ErrorMessage } from '@/components/ui/error-message'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  validatePresetGroupForm, 
  type PresetGroupFormData 
} from '@/lib/validations/preset-groups'

// Unified fetcher for SWR that handles authentication
const fetcher = async (key: string | [string, string]) => {
  let url: string, token: string | null;
  
  if (Array.isArray(key)) {
    [url, token] = key;
  } else {
    url = key;
    token = null;
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { headers });
  
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Error fetching ${url}: ${res.status}`, errorBody);
    throw new Error(`Failed to fetch data: ${res.status}`);
  }
  
  return res.json();
};

// Types for the preset group data structure
interface PresetGroup {
  id: string;
  name: string;
  description?: string;
  date?: string;
  session_mode: 'individual' | 'group';
  athlete_group_id?: string;
  created_at: string;
}

/**
 * Preset Group Editor - Main CRUD Interface
 * 
 * This component provides a comprehensive interface for managing preset groups:
 * - List all existing preset groups
 * - Create new preset groups
 * - Edit existing preset groups
 * - Delete preset groups
 * - Navigate between different views
 */
export default function PresetGroupEditor() {
  const router = useRouter();
  const { session } = useSession();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  
  // UI state management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state for creating new preset groups
  const [formData, setFormData] = useState<PresetGroupFormData>({
    name: '',
    description: '',
    date: '',
    sessionMode: 'individual',
    athleteGroupId: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get authentication token
  useEffect(() => {
    if (session) {
      session.getToken().then(setToken).catch(console.error);
    }
  }, [session]);

  // Fetch preset groups data
  const { 
    data: presetGroupsData, 
    error: presetGroupsError, 
    isLoading: presetGroupsLoading,
    mutate: mutatePresetGroups
  } = useSWR(
    token ? ['/api/plans/preset-groups', token] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const presetGroups: PresetGroup[] = presetGroupsData?.data?.groups || [];

  // Handle creating a new preset group
  const handleCreatePresetGroup = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    // Validate form data using Zod schema
    const validation = validatePresetGroupForm(formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    // Clear any previous errors
    setFormErrors({});
    setIsCreating(true);

    try {
      const response = await fetch('/api/plans/preset-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create preset group');
      }

      toast({
        title: "Success",
        description: "Preset group created successfully",
      });

      // Refresh the list
      mutatePresetGroups();

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        date: '',
        sessionMode: 'individual',
        athleteGroupId: ''
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating preset group:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create preset group",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting a preset group
  const handleDeletePresetGroup = async (groupId: string) => {
    if (!token) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/plans/preset-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete preset group');
      }

      toast({
        title: "Success",
        description: "Preset group deleted successfully",
      });

      // Refresh the data
      await mutatePresetGroups();
      
    } catch (error) {
      console.error('Error deleting preset group:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete preset group',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle form input changes
  const handleFormChange = (field: keyof PresetGroupFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Loading state
  if (!token || presetGroupsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (presetGroupsError) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <ErrorMessage
          message={`Failed to load preset groups: ${presetGroupsError.message}`}
          severity="error"
          variant="block"
        />
        <Button 
          onClick={() => mutatePresetGroups()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Preset Groups</h1>
            <p className="text-gray-600 mt-1">
              Manage your exercise preset groups for training sessions
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Preset Group</DialogTitle>
                <DialogDescription>
                  Create a new preset group to organize your exercises
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter group name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter group description (optional)"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      className={formErrors.description ? "border-red-500" : ""}
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500">{formErrors.description}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className={formErrors.date ? "border-red-500" : ""}
                    />
                    {formErrors.date && (
                      <p className="text-sm text-red-500">{formErrors.date}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sessionMode">Session Mode</Label>
                    <Select
                      value={formData.sessionMode}
                      onValueChange={(value) => handleFormChange('sessionMode', value)}
                    >
                      <SelectTrigger className={formErrors.sessionMode ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select session mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.sessionMode && (
                      <p className="text-sm text-red-500">{formErrors.sessionMode}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePresetGroup}
                  disabled={isCreating || !formData.name.trim()}
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preset Groups List */}
        {presetGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No preset groups yet</h3>
                  <p className="text-gray-600 mt-1">
                    Create your first preset group to start organizing exercises
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presetGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={group.session_mode === 'group' ? 'default' : 'secondary'}>
                      {group.session_mode === 'group' ? (
                        <Users className="w-3 h-3 mr-1" />
                      ) : (
                        <User className="w-3 h-3 mr-1" />
                      )}
                      {group.session_mode}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {group.date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(group.date)}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/preset-groups/${group.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Preset Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{group.name}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePresetGroup(group.id)}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 