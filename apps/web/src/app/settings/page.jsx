"use client"

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Lock, 
  Smartphone, 
  UserCog, 
  Save
} from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const [notificationSettings, setNotificationSettings] = useState({
    email_updates: true,
    workout_reminders: true,
    achievement_alerts: true,
    coach_messages: true
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    activity_sharing: true,
    show_workout_details: true,
    allow_data_analytics: true
  })
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    dark_mode: true,
    compact_view: false,
    high_contrast: false
  })
  
  // Handle notification toggle changes
  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    })
  }

  // Handle privacy setting changes
  const handlePrivacyChange = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting]
    })
  }
  
  // Handle appearance setting changes
  const handleAppearanceChange = (setting) => {
    setAppearanceSettings({
      ...appearanceSettings,
      [setting]: !appearanceSettings[setting]
    })
  }
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex items-center mb-6">
        <Settings className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
      </div>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full justify-start">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
            <Eye className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-lg">
            <UserCog className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Bell className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Email Updates</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive weekly updates about your training progress</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_updates} 
                    onCheckedChange={() => handleNotificationChange('email_updates')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Workout Reminders</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about upcoming scheduled workouts</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.workout_reminders} 
                    onCheckedChange={() => handleNotificationChange('workout_reminders')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Achievement Alerts</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Notifications when you earn badges or reach milestones</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.achievement_alerts} 
                    onCheckedChange={() => handleNotificationChange('achievement_alerts')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Coach Messages</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when your coach sends you a message</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.coach_messages} 
                    onCheckedChange={() => handleNotificationChange('coach_messages')}
                  />
                </div>
              </div>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Shield className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Privacy and Data Sharing
              </CardTitle>
              <CardDescription>
                Control what information is visible to others and how your data is used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Profile Visibility</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Set who can see your profile information</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="profile-visibility">Public</Label>
                    <Switch 
                      id="profile-visibility"
                      checked={privacySettings.profile_visibility === 'public'} 
                      onCheckedChange={() => setPrivacySettings({
                        ...privacySettings,
                        profile_visibility: privacySettings.profile_visibility === 'public' ? 'private' : 'public'
                      })}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Activity Sharing</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Share your running activities with followers</p>
                  </div>
                  <Switch 
                    checked={privacySettings.activity_sharing} 
                    onCheckedChange={() => handlePrivacyChange('activity_sharing')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Workout Details</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Show detailed workout metrics to others</p>
                  </div>
                  <Switch 
                    checked={privacySettings.show_workout_details} 
                    onCheckedChange={() => handlePrivacyChange('show_workout_details')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Data Analytics</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Allow anonymous data collection to improve the platform</p>
                  </div>
                  <Switch 
                    checked={privacySettings.allow_data_analytics} 
                    onCheckedChange={() => handlePrivacyChange('allow_data_analytics')}
                  />
                </div>
              </div>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <Eye className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Dark Mode</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                  </div>
                  <Switch 
                    checked={appearanceSettings.dark_mode} 
                    onCheckedChange={() => handleAppearanceChange('dark_mode')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">Compact View</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use smaller UI elements to show more content</p>
                  </div>
                  <Switch 
                    checked={appearanceSettings.compact_view} 
                    onCheckedChange={() => handleAppearanceChange('compact_view')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 dark:text-white">High Contrast</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Increase contrast for better accessibility</p>
                  </div>
                  <Switch 
                    checked={appearanceSettings.high_contrast} 
                    onCheckedChange={() => handleAppearanceChange('high_contrast')}
                  />
                </div>
              </div>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-white flex items-center">
                <UserCog className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-slate-800 dark:text-white">Account Security</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Update your password and security settings</p>
                  
                  <Button variant="outline" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Change Password
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-base font-medium text-slate-800 dark:text-white">Connected Devices</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Manage devices that have access to your account</p>
                  
                  <Button variant="outline" className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Manage Devices
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-base font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Irreversible account actions</p>
                  
                  <div className="flex space-x-3">
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20">
                      Download My Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 