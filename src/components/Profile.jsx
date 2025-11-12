import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { User, Mail, Key, CreditCard, Calendar, Shield } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match')
      return
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })

      if (response.ok) {
        alert('Password changed successfully')
        setIsPasswordDialogOpen(false)
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to change password')
      }
    } catch (error) {
      alert('Error changing password')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-white">Loading profile...</div>
    </div>
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-white">Failed to load profile</div>
    </div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
	        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
	        <p className="text-slate-400">Manage your account settings and preferences</p>},{find:
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-white">{profile.username}</h3>
                <p className="text-slate-400">{profile.email}</p>
                <Badge variant="outline" className="mt-2">
                  {profile.role === 'main_admin' ? 'Main Admin' :
                   profile.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input value={profile.username} disabled className="bg-slate-700 border-slate-600 text-white" />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={profile.email} disabled className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => setIsPasswordDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-3">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white capitalize">{profile.subscription_plan || 'Free'}</h3>
              <p className="text-sm text-slate-400 mt-1">Current Plan</p>
            </div>

            {profile.subscription_end_date && (
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Days Remaining</span>
                  <Badge variant={profile.subscription_days_remaining < 7 ? "destructive" : "default"}>
                    {profile.subscription_days_remaining} days
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {new Date(profile.subscription_end_date).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3 w-3" />
                <span>Status: {profile.subscription_status || 'Active'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-white">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-white">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-white">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="border-slate-600">
              Cancel
            </Button>
            <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Profile
