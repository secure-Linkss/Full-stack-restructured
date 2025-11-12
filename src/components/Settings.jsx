import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { CreditCard, MessageSquare, Settings as SettingsIcon, Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff, Wallet, Copy, Key, Slack, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import APIKeyManager from './APIKeyManager'
import StripePaymentForm from './StripePaymentForm'
import CryptoPaymentForm from './CryptoPaymentForm'

const Settings = () => {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('api-keys')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [adminPaymentConfig, setAdminPaymentConfig] = useState(null)

  // User Payment/Notification Settings
  const [userSettings, setUserSettings] = useState({
    preferred_payment_method: 'card',
    telegram_personal_chat_id: '',
    telegram_personal_notifications_enabled: false,
    slack_webhook_url: '',
    slack_notifications_enabled: false,
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
    enable_registrations: true
  })

  useEffect(() => {
    fetchUserAndSettings()
  }, [])

  const fetchUserAndSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const userRes = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      try {
        const userSettingsRes = await fetch('/api/settings/user', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (userSettingsRes.ok) {
          const data = await userSettingsRes.json()
          setUserSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching user settings:', e)
      }

      try {
        const adminRes = await fetch('/api/admin/system-config', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
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

  const saveUserSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false)
    setSelectedPlan(null)
    toast.success('Subscription process initiated. Check your email for confirmation.')
    // Optionally, refresh user data
    fetchUserAndSettings()
  }

  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    setSelectedPlan(null)
    toast.info('Payment cancelled.')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Settings...</span>
      </div>
    )
  }

  if (error && !success) {
    return (
      <Alert variant="destructive" className="bg-red-900/20 border-red-700">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-400">{error}</AlertDescription>
      </Alert>
    )
  }

  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin'

  return (
    <div className="space-y-6 p-6">
	      <h1 className="text-3xl font-bold text-white">Settings</h1>
	      <p className="text-slate-400">Manage your account preferences, API keys, and system configurations.</p>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto bg-slate-800 border border-slate-700">
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Key className="h-4 w-4 mr-2" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <MessageSquare className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <CreditCard className="h-4 w-4 mr-2" /> Payments
          </TabsTrigger>
          <TabsTrigger value="cdn" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <ImageIcon className="h-4 w-4 mr-2" /> CDN
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
              <SettingsIcon className="h-4 w-4 mr-2" /> System Config
            </TabsTrigger>
          )}
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-4">
          <APIKeyManager />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram Notifications */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" /> Telegram Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="telegram-switch" className="text-slate-300">
                    Enable Personal Telegram Notifications
                  </Label>
                  <Switch
                    id="telegram-switch"
                    checked={userSettings.telegram_personal_notifications_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, telegram_personal_notifications_enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram-chat-id" className="text-slate-300">Your Telegram Chat ID</Label>
                  <Input
                    id="telegram-chat-id"
                    placeholder="Enter your Telegram Chat ID"
                    value={userSettings.telegram_personal_chat_id}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, telegram_personal_chat_id: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-500">
                    Get your Chat ID by messaging the system bot.
                  </p>
                </div>
              </div>

              {/* Slack Notifications */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                  <Slack className="h-5 w-5 mr-2" /> Slack Notifications
                </h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="slack-switch" className="text-slate-300">
                    Enable Slack Notifications
                  </Label>
                  <Switch
                    id="slack-switch"
                    checked={userSettings.slack_notifications_enabled}
                    onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, slack_notifications_enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook" className="text-slate-300">Slack Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="Enter your Slack Webhook URL"
                    value={userSettings.slack_webhook_url}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, slack_webhook_url: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-500">
                    Notifications will be sent to this Slack channel.
                  </p>
                </div>
              </div>

              <Button 
                onClick={saveUserSettings} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
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
                Your current plan: <span className="font-bold text-blue-400">{user?.plan_type.toUpperCase()}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {showPaymentForm ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">
                    Complete Payment for {selectedPlan?.toUpperCase()} Plan
                  </h3>
                  {userSettings.preferred_payment_method === 'card' && adminPaymentConfig?.stripe_enabled ? (
                    <StripePaymentForm 
                      planType={selectedPlan} 
                      onSuccess={handlePaymentSuccess} 
                      onCancel={handlePaymentCancel} 
                    />
                  ) : userSettings.preferred_payment_method === 'crypto' && adminPaymentConfig?.crypto_enabled ? (
                    <CryptoPaymentForm 
                      planType={selectedPlan} 
                      planPrice={selectedPlan === 'pro' ? 29.99 : 99.99} // Mock prices
                      onSuccess={handlePaymentSuccess} 
                      onCancel={handlePaymentCancel} 
                    />
                  ) : (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-700">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-400">
                        Payment method not available or not configured by admin.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Upgrade Your Plan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`p-4 cursor-pointer transition-all ${user?.plan_type === 'pro' ? 'border-green-500 bg-green-900/20' : 'border-slate-700 hover:border-blue-500'}`}
                      onClick={() => {
                        setSelectedPlan('pro')
                        setShowPaymentForm(true)
                      }}
                    >
                      <CardTitle className="text-white">Pro Plan</CardTitle>
                      <p className="text-slate-400">$29.99/month</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        disabled={user?.plan_type === 'pro'}
                      >
                        {user?.plan_type === 'pro' ? 'Current Plan' : 'Select Pro'}
                      </Button>
                    </Card>
                    <Card 
                      className={`p-4 cursor-pointer transition-all ${user?.plan_type === 'enterprise' ? 'border-green-500 bg-green-900/20' : 'border-slate-700 hover:border-blue-500'}`}
                      onClick={() => {
                        setSelectedPlan('enterprise')
                        setShowPaymentForm(true)
                      }}
                    >
                      <CardTitle className="text-white">Enterprise Plan</CardTitle>
                      <p className="text-slate-400">$99.99/month</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        disabled={user?.plan_type === 'enterprise'}
                      >
                        {user?.plan_type === 'enterprise' ? 'Current Plan' : 'Select Enterprise'}
                      </Button>
                    </Card>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-700">
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
                    <p className="text-sm text-slate-500">
                      Select your preferred method before proceeding to payment.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CDN Tab */}
        <TabsContent value="cdn" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">CDN Configuration</CardTitle>
              <p className="text-slate-400 text-sm">
                Configure your Content Delivery Network (CDN) settings for faster asset loading.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="cdn-switch" className="text-slate-300">
                  Enable CDN for Assets
                </Label>
                <Switch
                  id="cdn-switch"
                  checked={userSettings.cdn_enabled}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, cdn_enabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdn-url" className="text-slate-300">CDN Base URL</Label>
                <Input
                  id="cdn-url"
                  placeholder="e.g., https://cdn.yourdomain.com"
                  value={userSettings.cdn_url}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, cdn_url: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!userSettings.cdn_enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdn-provider" className="text-slate-300">CDN Provider</Label>
                <Input
                  id="cdn-provider"
                  placeholder="e.g., Cloudflare, AWS CloudFront"
                  value={userSettings.cdn_provider}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, cdn_provider: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!userSettings.cdn_enabled}
                />
              </div>
              <Button 
                onClick={saveUserSettings} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save CDN Settings
              </Button>
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
                <p className="text-slate-400 text-sm">
                  These settings affect all users and the entire application.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-400">General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-links" className="text-slate-300">Max Links per User (Default)</Label>
                      <Input
                        id="max-links"
                        type="number"
                        value={adminSystemConfig.max_links_per_user}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, max_links_per_user: parseInt(e.target.value) }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retention-days" className="text-slate-300">Analytics Retention (Days)</Label>
                      <Input
                        id="retention-days"
                        type="number"
                        value={adminSystemConfig.retention_days}
                        onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode" className="text-slate-300">
                      Maintenance Mode (Disable Site Access)
                    </Label>
                    <Switch
                      id="maintenance-mode"
                      checked={adminSystemConfig.maintenance_mode}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, maintenance_mode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-registrations" className="text-slate-300">
                      Enable New User Registrations
                    </Label>
                    <Switch
                      id="enable-registrations"
                      checked={adminSystemConfig.enable_registrations}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, enable_registrations: checked }))}
                    />
                  </div>
                </div>

                {/* Payment Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" /> Payment Gateways
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe-enabled" className="text-slate-300">
                      Enable Stripe Payments
                    </Label>
                    <Switch
                      id="stripe-enabled"
                      checked={adminSystemConfig.stripe_enabled}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, stripe_enabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe-key" className="text-slate-300">Stripe Publishable Key</Label>
                    <Input
                      id="stripe-key"
                      placeholder="pk_live_..."
                      value={adminSystemConfig.stripe_publishable_key}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.stripe_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret" className="text-slate-300">Stripe Secret Key</Label>
                    <Input
                      id="stripe-secret"
                      placeholder="sk_live_..."
                      value={adminSystemConfig.stripe_secret_key}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.stripe_enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <Label htmlFor="crypto-enabled" className="text-slate-300">
                      Enable Crypto Payments
                    </Label>
                    <Switch
                      id="crypto-enabled"
                      checked={adminSystemConfig.crypto_enabled}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, crypto_enabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="btc-address" className="text-slate-300">Bitcoin Wallet Address</Label>
                    <Input
                      id="btc-address"
                      placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                      value={adminSystemConfig.crypto_bitcoin_address}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, crypto_bitcoin_address: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.crypto_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eth-address" className="text-slate-300">Ethereum Wallet Address</Label>
                    <Input
                      id="eth-address"
                      placeholder="0x..."
                      value={adminSystemConfig.crypto_ethereum_address}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, crypto_ethereum_address: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.crypto_enabled}
                    />
                  </div>
                </div>

                {/* Telegram System Notifications */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" /> System Telegram Notifications
                  </h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-telegram-switch" className="text-slate-300">
                      Enable System Telegram Notifications (e.g., New User, Payment Proof)
                    </Label>
                    <Switch
                      id="system-telegram-switch"
                      checked={adminSystemConfig.telegram_system_notifications_enabled}
                      onCheckedChange={(checked) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_notifications_enabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system-telegram-token" className="text-slate-300">System Telegram Bot Token</Label>
                    <Input
                      id="system-telegram-token"
                      placeholder="Enter your bot token"
                      value={adminSystemConfig.telegram_system_token}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_token: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.telegram_system_notifications_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system-telegram-chat-id" className="text-slate-300">System Telegram Chat ID (Admin Group)</Label>
                    <Input
                      id="system-telegram-chat-id"
                      placeholder="Enter admin group chat ID"
                      value={adminSystemConfig.telegram_system_chat_id}
                      onChange={(e) => setAdminSystemConfig(prev => ({ ...prev, telegram_system_chat_id: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!adminSystemConfig.telegram_system_notifications_enabled}
                    />
                  </div>
                </div>

                <Button 
                  onClick={saveAdminSystemConfig} 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
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
