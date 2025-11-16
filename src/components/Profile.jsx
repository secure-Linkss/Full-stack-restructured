import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  User, Mail, Phone, Shield, CreditCard, Calendar,
  CheckCircle, Loader, Upload, Edit, Key, Lock
} from 'lucide-react'
import { toast } from 'sonner'

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setProfileData({
          username: data.user.username || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        setAvatarPreview(data.user.avatar_url)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/settings/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to upload avatar')
      
      toast.success('Avatar updated successfully')
      fetchUserData()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email,
          phone: profileData.phone
        })
      })

      if (!response.ok) throw new Error('Failed to update profile')
      
      toast.success('Profile updated successfully')
      fetchUserData()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (profileData.new_password !== profileData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: profileData.current_password,
          new_password: profileData.new_password
        })
      })

      if (!response.ok) throw new Error('Failed to change password')
      
      toast.success('Password changed successfully')
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Profile...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-blue-600 text-white text-4xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.username || 'User'}
              </h2>
              <p className="text-slate-400 mb-2">{user?.email}</p>
              
              <div className="flex gap-2 mb-4">
                <Badge className="bg-blue-600">{user?.plan_type || 'free'}</Badge>
                <Badge className={`${
                  user?.role === 'main_admin' ? 'bg-purple-600' :
                  user?.role === 'admin' ? 'bg-red-600' : 'bg-green-600'
                }`}>
                  {user?.role || 'member'}
                </Badge>
              </div>

              <div className="w-full space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Avatar
                </Button>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Member Since</span>
                  <span className="text-white">{user?.created_at || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Links</span>
                  <span className="text-white">{user?.total_links || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Clicks</span>
                  <span className="text-white">{user?.total_clicks || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700 border border-slate-600">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <User className="h-4 w-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Lock className="h-4 w-4 mr-2" /> Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-400 text-sm">Email</span>
                    </div>
                    <p className="text-white font-medium">{user?.email || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-green-400" />
                      <span className="text-slate-400 text-sm">Username</span>
                    </div>
                    <p className="text-white font-medium">{user?.username || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="h-5 w-5 text-purple-400" />
                      <span className="text-slate-400 text-sm">Phone</span>
                    </div>
                    <p className="text-white font-medium">{user?.phone || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-red-400" />
                      <span className="text-slate-400 text-sm">Role</span>
                    </div>
                    <p className="text-white font-medium capitalize">{user?.role || 'member'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-yellow-400" />
                      <span className="text-slate-400 text-sm">Plan</span>
                    </div>
                    <p className="text-white font-medium capitalize">{user?.plan_type || 'free'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      <span className="text-slate-400 text-sm">Joined</span>
                    </div>
                    <p className="text-white font-medium">{user?.created_at || 'N/A'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-6 space-y-4">
                <div>
                  <Label className="text-white">Username</Label>
                  <Input
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Phone</Label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </TabsContent>

              <TabsContent value="security" className="mt-6 space-y-4">
                <div>
                  <Label className="text-white">Current Password</Label>
                  <Input
                    type="password"
                    value={profileData.current_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">New Password</Label>
                  <Input
                    type="password"
                    value={profileData.new_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={profileData.confirm_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile