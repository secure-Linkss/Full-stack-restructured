import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  CreditCard, MessageSquare, Settings as SettingsIcon, Shield, 
  CheckCircle, AlertCircle, Loader, Eye, EyeOff, Wallet, Copy, 
  Key, Slack, Image as ImageIcon, User, Lock, Smartphone, 
  Monitor, Trash2, RefreshCw, Download, Upload, Mail, Bell,
  Globe, Palette, Database, TestTube, XCircle
} from 'lucide-react'
import { toast } from 'sonner'

const Settings = () => {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [adminPaymentConfig, setAdminPaymentConfig] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [domains, setDomains] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [sessions, setSessions] = useState([])
  const [loginHistory, setLoginHistory] = useState([])
  const [invoices, setInvoices] = useState([])

  // User Settings State
  const [userSettings, setUserSettings] = useState({
    username: '',
    email: '',
    phone: '',
    avatar_url: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
    preferred_payment_method: 'card',
    telegram_personal_chat_id: '',
    telegram_personal_notifications_enabled: false,
    slack_webhook_url: '',
    slack_notifications_enabled: false,
    default_domain: '',
    theme: 'dark',
    cdn_enabled: false,
    cdn_url: '',
    cdn_provider: 'cloudflare'
  })

  // Admin System Settings
  const [adminSystemConfig, setAdminSystemConfig] = useState({
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_price_id: '',
    crypto_enabled: false,
    crypto_bitcoin_address: '',
    crypto_ethereum_address: '',
    telegram_system_token: '',
    telegram_system_chat_id: '',
    telegram_system_notifications_enabled: false,
    max_links_per_user: 100,
    max_campaigns_per_user: 50,
    enable_email_capture: true,
    enable_analytics: true,
    retention_days: 90,
    enable_custom_domains: true,
    maintenance_mode: false,
    enable_registrations: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    company_name: '',
    company_logo_url: '',
    announcement_enabled: false,
    announcement_message: ''
  })

  useEffect(() => {
    fetchUserAndSettings()
  }, [])

  const fetchUserAndSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')

      // Fetch user data
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
        setUserSettings(prev => ({
          ...prev,
          username: userData.user.username || '',
          email: userData.user.email || '',
          phone: userData.user.phone || '',
          avatar_url: userData.user.avatar_url || ''
        }))
        setAvatarPreview(userData.user.avatar_url)
      }

      // Fetch user settings
      try {
        const userSettingsRes = await fetch('/api/settings/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (userSettingsRes.ok) {
          const data = await userSettingsRes.json()
          setUserSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching user settings:', e)
      }

      // Fetch domains
      try {
        const domainsRes = await fetch('/api/admin/domains', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (domainsRes.ok) {
          const data = await domainsRes.json()
          setDomains(Array.isArray(data) ? data : data.domains || [])
        }
      } catch (e) {
        console.error('Error fetching domains:', e)
      }

      // Fetch API keys
      try {
        const apiKeysRes = await fetch('/api/settings/api-keys', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (apiKeysRes.ok) {
          const data = await apiKeysRes.json()
          setApiKeys(Array.isArray(data) ? data : data.api_keys || [])
        }
      } catch (e) {
        console.error('Error fetching API keys:', e)
      }

      // Fetch sessions
      try {
        const sessionsRes = await fetch('/api/settings/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(Array.isArray(data) ? data : data.sessions || [])
        }
      } catch (e) {
        console.error('Error fetching sessions:', e)
      }

      // Fetch login history
      try {
        const historyRes = await fetch('/api/settings/login-history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (historyRes.ok) {
          const data = await historyRes.json()
          setLoginHistory(Array.isArray(data) ? data : data.history || [])
        }
      } catch (e) {
        console.error('Error fetching login history:', e)
      }

      // Fetch invoices
      try {
        const invoicesRes = await fetch('/api/settings/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (invoicesRes.ok) {
          const data = await invoicesRes.json()
          setInvoices(Array.isArray(data) ? data : data.invoices || [])
        }
      } catch (e) {
        console.error('Error fetching invoices:', e)
      }

      // Fetch admin config if admin
      try {
        const adminRes = await fetch('/api/admin/system-config', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (adminRes.ok) {
          const data = await adminRes.json()
          setAdminSystemConfig(prev => ({ ...prev, ...data }))
          setAdminPaymentConfig(data)
        }
      } catch (e) {
        console.error('Error fetching admin system config:', e)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
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
      
      const data = await response.json()
      setUserSettings(prev => ({ ...prev, avatar_url: data.avatar_url }))
      toast.success('Avatar updated successfully')
      fetchUserAndSettings()
    } catch (e) {
      toast.error(e.message || 'Error uploading avatar')
    } finally {
      setSaving(false)
    }
  }

  const saveAccountSettings = async () => {
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
          username: userSettings.username,
          email: userSettings.email,
          phone: userSettings.phone
        })
      })

      if (!response.ok) throw new Error('Failed to save account settings')
      
      toast.success('Account settings saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchUserAndSettings()
    } catch (e) {
      toast.error(e.message || 'Error saving account settings')
      setError(e.message || 'Error saving account settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (userSettings.new_password !== userSettings.confirm_password) {
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
          current_password: userSettings.current_password,
          new_password: userSettings.new_password
        })
      })

      if (!response.ok) throw new Error('Failed to change password')
      
      toast.success('Password changed successfully')
      setUserSettings(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
    } catch (e) {
      toast.error(e.message || 'Error changing password')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateApiKey = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'New API Key' })
      })

      if (!response.ok) throw new Error('Failed to generate API key')
      
      toast.success('API key generated successfully')
      fetchUserAndSettings()
    } catch (e) {
      toast.error(e.message || 'Error generating API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete API key')
      
      toast.success('API key deleted successfully')
      fetchUserAndSettings()
    } catch (e) {
      toast.error(e.message || 'Error deleting API key')
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to logout from all devices?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/logout-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to logout all devices')
      
      toast.success('Logged out from all devices')
      fetchUserAndSettings()
    } catch (e) {
      toast.error(e.message || 'Error logging out')
    }
  }

  const saveUserSettings = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userSettings)
      })

      if (!response.ok) throw new Error('Failed to save user settings')
      
      toast.success('User settings saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      toast.error(e.message || 'Error saving user settings')
      setError(e.message || 'Error saving user settings')
    } finally {
      setSaving(false)
    }
  }

  const saveAdminSystemConfig = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminSystemConfig)
      })

      if (!response.ok) throw new Error('Failed to save admin system config')
      
      toast.success('Admin system configuration saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      toast.error(e.message || 'Error saving admin system config')
      setError(e.message || 'Error saving admin system config')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/test-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: adminSystemConfig.telegram_system_token,
          chat_id: adminSystemConfig.telegram_system_chat_id
        })
      })

      if (!response.ok) throw new Error('Failed to test Telegram connection')
      
      toast.success('Test message sent successfully')
    } catch (e) {
      toast.error(e.message || 'Error testing Telegram')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Settings...</span>
      </div>
    )
  }

  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin'

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account preferences, API keys, and system configurations</p>
      </div>

      {error && !success && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto bg-slate-800 border border-slate-700">
          <TabsTrigger value="account" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <User className="h-4 w-4 mr-2" /> Account
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Shield className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Key className="h-4 w-4 mr-2" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <CreditCard className="h-4 w-4 mr-2" /> Payments
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
              <SettingsIcon className="h-4 w-4 mr-2" /> System
            </TabsTrigger>
          )}
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Profile Picture</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={!avatarFile || saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload Avatar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
                
                <div>
                  <Label className="text-white">Username</Label>
                  <Input
                    value={userSettings.username}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Phone Number</Label>
                  <Input
                    type="tel"
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  onClick={saveAccountSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save Account Settings
                </Button>
              </div>

              {/* Password Change */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Change Password</h3>
                
                <div>
                  <Label className="text-white">Current Password</Label>
                  <Input
                    type="password"
                    value={userSettings.current_password}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, current_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">New Password</Label>
                  <Input
                    type="password"
                    value={userSettings.new_password}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, new_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={userSettings.confirm_password}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, confirm_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </div>

              {/* 2FA */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable 2FA</Label>
                    <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={userSettings.two_factor_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, two_factor_enabled: checked }))}
                  />
                </div>
              </div>

              {/* Default Domain */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Default Tracking Domain</h3>
                <div>
                  <Label className="text-white">Select Default Domain</Label>
                  <Select
                    value={userSettings.default_domain}
                    onValueChange={(value) => setUserSettings(prev => ({ ...prev, default_domain: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {domains.map(domain => (
                        <SelectItem key={domain.id} value={domain.domain}>{domain.domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Appearance</h3>
                <div>
                  <Label className="text-white">Theme</Label>
                  <Select
                    value={userSettings.theme}
                    onValueChange={(value) => setUserSettings(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Active Sessions</h3>
                  <Button
                    onClick={handleLogoutAllDevices}
                    variant="outline"
                    className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Logout All Devices
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Monitor className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{session.device || 'Unknown Device'}</p>
                            <p className="text-sm text-slate-400">{session.location || 'Unknown Location'}</p>
                            <p className="text-xs text-slate-500">{session.last_active || 'Just now'}</p>
                          </div>
                        </div>
                        {session.is_current && (
                          <Badge className="bg-green-600 text-white">Current</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login History */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Login History</h3>
                <div className="space-y-2">
                  {loginHistory.map((login, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">{login.location || 'Unknown Location'}</p>
                          <p className="text-xs text-slate-400">{login.ip_address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">{login.timestamp}</p>
                          <Badge className={login.success ? 'bg-green-600' : 'bg-red-600'}>
                            {login.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">API Key Management</CardTitle>
                <Button
                  onClick={handleGenerateApiKey}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((key, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-white font-medium">{key.name || 'API Key'}</p>
                      <p className="text-sm text-slate-400 font-mono">{key.key}</p>
                      <p className="text-xs text-slate-500 mt-1">Created: {key.created_at}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(key.key)
                          toast.success('API key copied')
                        }}
                        className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">Usage: {key.usage || 0} requests</span>
                    <span className="text-slate-400">Rate Limit: {key.rate_limit || 1000}/hour</span>
                    <Badge className={key.enabled ? 'bg-green-600' : 'bg-slate-600'}>
                      {key.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" /> Telegram Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable Personal Telegram Notifications</Label>
                  <Switch
                    checked={userSettings.telegram_personal_notifications_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, telegram_personal_notifications_enabled: checked }))}
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Your Telegram Chat ID</Label>
                  <Input
                    placeholder="Enter your Telegram Chat ID"
                    value={userSettings.telegram_personal_chat_id}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, telegram_personal_chat_id: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-500 mt-1">Get your Chat ID by messaging the system bot</p>
                </div>
              </div>

              {/* Slack */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                  <Slack className="h-5 w-5 mr-2" /> Slack Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Enable Slack Notifications</Label>
                  <Switch
                    checked={userSettings.slack_notifications_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, slack_notifications_enabled: checked }))}
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Slack Webhook URL</Label>
                  <Input
                    placeholder="Enter your Slack Webhook URL"
                    value={userSettings.slack_webhook_url}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, slack_webhook_url: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={saveUserSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription & Payment</CardTitle>
              <p className="text-slate-400 text-sm">
                Your current plan: <span className="font-bold text-blue-400">{user?.plan_type?.toUpperCase() || 'FREE'}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Payment Method Preference</h3>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={userSettings.preferred_payment_method === 'card' ? 'default' : 'outline'}
                    onClick={() => setUserSettings(prev => ({ ...prev, preferred_payment_method: 'card' }))}
                    className={userSettings.preferred_payment_method === 'card' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}
                    disabled={!adminPaymentConfig?.stripe_enabled}
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Card (Stripe)
                  </Button>
                  <Button
                    variant={userSettings.preferred_payment_method === 'crypto' ? 'default' : 'outline'}
                    onClick={() => setUserSettings(prev => ({ ...prev, preferred_payment_method: 'crypto' }))}
                    className={userSettings.preferred_payment_method === 'crypto' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}
                    disabled={!adminPaymentConfig?.crypto_enabled}
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Crypto
                  </Button>
                </div>
              </div>

              {/* Invoices */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white">Invoice History</h3>
                <div className="space-y-2">
                  {invoices.map((invoice, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Invoice #{invoice.id}</p>
                          <p className="text-sm text-slate-400">{invoice.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-bold">${invoice.amount}</span>
                          <Badge className={invoice.status === 'paid' ? 'bg-green-600' : 'bg-yellow-600'}>
                            {invoice.status}
                          </Badge>
                          <Button size="icon" variant="outline" className="bg-slate-600 border-slate-500">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Config Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="system" className="mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" /> Global System Configuration
                </CardTitle>
                <p className="text-slate-400 text-sm">These settings affect all users and the entire application</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Telegram System */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" /> System Telegram Notifications
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Enable System Telegram Notifications</Label>
                    <Switch
                      checked={adminSystemConfig.telegram_system_notifications_enabled}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_notifications_enabled: checked }))}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">System Telegram Bot Token</Label>
                    <Input
                      placeholder="Enter bot token"
                      value={adminSystemConfig.telegram_system_token}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_token: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">System Telegram Chat ID</Label>
                    <Input
                      placeholder="Enter admin group chat ID"
                      value={adminSystemConfig.telegram_system_chat_id}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_chat_id: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleTestTelegram}
                    disabled={saving}
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>

                {/* Payment Gateways */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" /> Payment Gateways
                  </h3>
                  
                  {/* Stripe */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Enable Stripe Payments</Label>
                      <Switch
                        checked={adminSystemConfig.stripe_enabled}
                        onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, stripe_enabled: checked }))}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Stripe Publishable Key</Label>
                      <Input
                        placeholder="pk_live_..."
                        value={adminSystemConfig.stripe_publishable_key}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Stripe Secret Key</Label>
                      <Input
                        type="password"
                        placeholder="sk_live_..."
                        value={adminSystemConfig.stripe_secret_key}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Crypto */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Enable Crypto Payments</Label>
                      <Switch
                        checked={adminSystemConfig.crypto_enabled}
                        onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, crypto_enabled: checked }))}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Bitcoin Wallet Address</Label>
                      <Input
                        placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        value={adminSystemConfig.crypto_bitcoin_address}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, crypto_bitcoin_address: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Ethereum Wallet Address</Label>
                      <Input
                        placeholder="0x..."
                        value={adminSystemConfig.crypto_ethereum_address}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, crypto_ethereum_address: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SMTP Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <Mail className="h-5 w-5 mr-2" /> SMTP Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">SMTP Host</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={adminSystemConfig.smtp_host}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">SMTP Port</Label>
                      <Input
                        type="number"
                        placeholder="587"
                        value={adminSystemConfig.smtp_port}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">SMTP Username</Label>
                    <Input
                      value={adminSystemConfig.smtp_user}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">SMTP Password</Label>
                    <Input
                      type="password"
                      value={adminSystemConfig.smtp_password}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* System Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400">System Settings</h3>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Maintenance Mode</Label>
                    <Switch
                      checked={adminSystemConfig.maintenance_mode}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, maintenance_mode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Enable New User Registrations</Label>
                    <Switch
                      checked={adminSystemConfig.enable_registrations}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, enable_registrations: checked }))}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Company Name</Label>
                    <Input
                      value={adminSystemConfig.company_name}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, company_name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveAdminSystemConfig}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save System Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default Settings