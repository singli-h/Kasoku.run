"use client"

import { useState, useEffect } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, PenSquare, User, Calendar, MapPin, Shield, Edit, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { session, isLoaded: isSessionLoaded, isSignedIn } = useSession()
  const [profileData, setProfileData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    if (!isSessionLoaded) return
    if (!isSignedIn) {
      setProfileError('Not signed in')
      setLoadingProfile(false)
      return
    }
    const fetchProfile = async () => {
      try {
        const token = await session.getToken()
        const res = await fetch('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json()
        if (!res.ok || body.status !== 'success') throw new Error(body.message || 'Failed to fetch profile')
        setProfileData(body.data)
      } catch (err) {
        setProfileError(err.message)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [session, isSessionLoaded, isSignedIn])

  if (!isUserLoaded || loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-500 mb-4" />
        <h2 className="text-xl font-medium">Loading your profile...</h2>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-medium text-red-500 mb-4">Error: {profileError}</h2>
        <Button variant="outline" className="flex items-center border-blue-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800">
          <Edit className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
          Try Again
        </Button>
      </div>
    )
  }

  // Extract user info from profile data
  const userData = profileData;
  const role = userData?.role || 'user';
  const fullName = user?.fullName || `${userData?.first_name || ''} ${userData?.last_name || ''}`;
  const email = user?.primaryEmailAddress?.emailAddress || userData?.email || '';
  const username = userData?.username || '';
  const subscription = userData?.subscription_status || 'Free';
  const avatarUrl = user?.imageUrl || userData?.avatar_url;
  const birthdate = userData?.birthdate ? format(new Date(userData.birthdate), 'MMMM d, yyyy') : 'Not set';
  const timezone = userData?.timezone || 'UTC';
  const initials = fullName.split(' ').map(n => n?.[0] || '').join('').toUpperCase();
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-24 w-24 mb-4 shadow-md">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{fullName}</h2>
                <p className="text-muted-foreground mt-1">{email}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <User className="h-4 w-4 mr-1" />
                  <span>@{username}</span>
                </div>
                <Badge className="mt-3 bg-blue-500 hover:bg-blue-600 text-white">{role || 'User'}</Badge>
              </div>
              
              <div className="flex justify-center mt-4">
                <Button variant="outline" className="flex items-center border-blue-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800">
                  <Edit className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                  Edit Profile
                </Button>
              </div>
              
              <Separator className="my-4 bg-slate-200 dark:bg-slate-700" />
              
              {/* User details */}
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-start">
                  <Shield className="h-4 w-4 mt-1 mr-2 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Role</p>
                    <p className="font-medium text-slate-800 dark:text-white capitalize">{role || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mt-1 mr-2 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Birthdate</p>
                    <p className="font-medium text-slate-800 dark:text-white">{birthdate}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-1 mr-2 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Timezone</p>
                    <p className="font-medium text-slate-800 dark:text-white">{timezone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs section */}
        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full justify-start">
              <TabsTrigger value="personal" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
                Personal Info
              </TabsTrigger>
              {role === 'athlete' && (
                <TabsTrigger value="athlete" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
                  Athlete Details
                </TabsTrigger>
              )}
              {role === 'coach' && (
                <TabsTrigger value="coach" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
                  Coach Details
                </TabsTrigger>
              )}
              <TabsTrigger value="subscription" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
                Subscription
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <User className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your basic account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{fullName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">@{username}</dd>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white capitalize">{role || 'Not set'}</dd>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Birthdate</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{birthdate}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Timezone</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{timezone}</dd>
                      </div>
                    </div>
                  </dl>
                  
                  <div className="mt-6">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <PenSquare className="h-4 w-4 mr-2" />
                      Edit Personal Info
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Athlete Details Tab */}
            {role === 'athlete' && (
              <TabsContent value="athlete">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-white flex items-center">
                      <svg className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Athlete Details
                    </CardTitle>
                    <CardDescription>
                      Your athletic profile and training information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Height</dt>
                          <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.height || 'Not set'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Weight</dt>
                          <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.weight || 'Not set'}</dd>
                        </div>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Training History</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.training_history || 'Not set'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Training Goals</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.training_goals || 'Not set'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Events</dt>
                        <dd className="mt-1">
                          {profileData?.roleSpecificData?.events && profileData.roleSpecificData.events.length > 0 
                            ? profileData.roleSpecificData.events.map((event, i) => (
                                <Badge key={i} className="inline-block bg-blue-100 hover:bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-xs mr-2 mb-2">
                                  {event.name}
                                </Badge>
                              ))
                            : <span className="text-slate-600 dark:text-slate-400">No events selected</span>
                          }
                        </dd>
                      </div>
                    </dl>
                    
                    <div className="mt-6">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <PenSquare className="h-4 w-4 mr-2" />
                        Edit Athlete Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {/* Coach Details Tab */}
            {role === 'coach' && (
              <TabsContent value="coach">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-slate-800 dark:text-white flex items-center">
                      <svg className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      Coach Details
                    </CardTitle>
                    <CardDescription>
                      Your coaching profile and expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Specialization</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.specialization || 'Not set'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Experience</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.experience || 'Not set'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Coaching Philosophy</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.philosophy || 'Not set'}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Sport Focus</dt>
                        <dd className="mt-1 text-slate-800 dark:text-white">{profileData?.roleSpecificData?.sport_focus || 'Not set'}</dd>
                      </div>
                    </dl>
                    
                    <div className="mt-6">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <PenSquare className="h-4 w-4 mr-2" />
                        Edit Coach Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <svg className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Subscription
                  </CardTitle>
                  <CardDescription>
                    Your current subscription plan and details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg mb-6 border border-blue-100 dark:border-blue-900/30">
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">Current Plan</h3>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 capitalize">{subscription}</span>
                      <span className="ml-2 text-slate-500 dark:text-slate-400">plan</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">Plan Features</h4>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          Personalized training plans
                        </li>
                        <li className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          Progress tracking dashboard
                        </li>
                        <li className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          Access to all basic features
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20">
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 