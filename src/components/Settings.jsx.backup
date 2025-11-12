import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Shield,
  Save,
  CheckCircle
} from 'lucide-react'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    clickAlerts: false,
    weeklyReport: true,
    securityAlerts: true
  })
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    language: 'en',
    theme: 'dark'
  })

  useEffect(() => {
    fetchUserSettings()
  }, [])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData({
          ...profileData,
          username: data.username || '',
          email: data.email || ''
        })
        setNotifications(data.notifications || notifications)
        setPreferences(data.preferences || preferences)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email
        })
      })

      if (response.ok) {
        showSuccess()
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        })
      })

      if (response.ok) {
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        showSuccess()
      }
    } catch (error) {
      console.error('Error changing password:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notifications)
      })

      if (response.ok) {
        showSuccess()
      }
    } catch (error) {
      console.error('Error saving notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        showSuccess()
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <p className="text-green-400">Settings saved successfully!</p>
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-slate-800 mb-8 gap-1 sm:gap-0">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="grid grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Shield className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-slate-400">Receive email updates about your account</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Click Alerts</Label>
                  <p className="text-sm text-slate-400">Get notified when your links are clicked</p>
                </div>
                <Switch
                  checked={notifications.clickAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, clickAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-slate-400">Receive weekly performance reports</p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-sm text-slate-400">Get alerts about suspicious activity</p>
                </div>
                <Switch
                  checked={notifications.securityAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button onClick={handleSavePreferences} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings
