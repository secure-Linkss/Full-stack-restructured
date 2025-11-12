import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { CreditCard, MessageSquare, Settings, Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('payments')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showSecrets, setShowSecrets] = useState({})

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    // Stripe
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_price_id: '',
    
    // Crypto
    crypto_enabled: false,
    crypto_bitcoin_address: '',
    crypto_ethereum_address: '',
    crypto_accepted_coins: ['BTC', 'ETH'],
    
    // Telegram
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_notifications_enabled: false
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
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
    fetchAllSettings()
  }, [])

  const fetchAllSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch payment settings
      try {
        const paymentRes = await fetch('/api/settings/payments')
        if (paymentRes.ok) {
          const data = await paymentRes.json()
          setPaymentSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching payment settings:', e)
      }

      // Fetch system settings
      try {
        const systemRes = await fetch('/api/settings/system')
        if (systemRes.ok) {
          const data = await systemRes.json()
          setSystemSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching system settings:', e)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const savePaymentSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings)
      })

      if (!response.ok) throw new Error('Failed to save payment settings')
      
      toast.success('Payment settings saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving payment settings:', error)
      toast.error('Failed to save payment settings')
    } finally {
      setSaving(false)
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      })

      if (!response.ok) throw new Error('Failed to save system settings')
      
      toast.success('System settings saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving system settings:', error)
      toast.error('Failed to save system settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleSecretVisibility = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-700 rounded w-1/3"></div>
          <div className="h-96 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-sm sm:text-base">Manage payments, integrations, and system configuration</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-slate-800 border border-slate-700 p-1">
          <TabsTrigger value="payments" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="telegram" className="text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Telegram</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stripe Configuration */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  Stripe Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Stripe</Label>
                  <Switch
                    checked={paymentSettings.stripe_enabled}
                    onCheckedChange={(checked) => 
                      setPaymentSettings(prev => ({ ...prev, stripe_enabled: checked }))
                    }
                  />
                </div>

                {paymentSettings.stripe_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-white">Publishable Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets.stripe_pub ? "text" : "password"}
                          placeholder="pk_live_..."
                          value={paymentSettings.stripe_publishable_key}
                          onChange={(e) => 
                            setPaymentSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSecretVisibility('stripe_pub')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {showSecrets.stripe_pub ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Secret Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets.stripe_secret ? "text" : "password"}
                          placeholder="sk_live_..."
                          value={paymentSettings.stripe_secret_key}
                          onChange={(e) => 
                            setPaymentSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSecretVisibility('stripe_secret')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {showSecrets.stripe_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Webhook Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets.stripe_webhook ? "text" : "password"}
                          placeholder="whsec_..."
                          value={paymentSettings.stripe_webhook_secret}
                          onChange={(e) => 
                            setPaymentSettings(prev => ({ ...prev, stripe_webhook_secret: e.target.value }))
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSecretVisibility('stripe_webhook')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {showSecrets.stripe_webhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Price ID</Label>
                      <Input
                        placeholder="price_..."
                        value={paymentSettings.stripe_price_id}
                        onChange={(e) => 
                          setPaymentSettings(prev => ({ ...prev, stripe_price_id: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    {/* Stripe Payment Form Preview */}
                    <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                      <p className="text-sm text-slate-300 mb-3 font-semibold">Payment Form Preview</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400">Card Number</label>
                          <Input
                            placeholder="4242 4242 4242 4242"
                            disabled
                            className="bg-slate-600 border-slate-500 text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-400">Expiry</label>
                            <Input
                              placeholder="MM/YY"
                              disabled
                              className="bg-slate-600 border-slate-500 text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">CVC</label>
                            <Input
                              placeholder="123"
                              disabled
                              className="bg-slate-600 border-slate-500 text-slate-400"
                            />
                          </div>
                        </div>
                        <Button disabled className="w-full bg-blue-600/50">
                          Pay with Stripe
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Crypto Configuration */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-400" />
                  Crypto Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Crypto</Label>
                  <Switch
                    checked={paymentSettings.crypto_enabled}
                    onCheckedChange={(checked) => 
                      setPaymentSettings(prev => ({ ...prev, crypto_enabled: checked }))
                    }
                  />
                </div>

                {paymentSettings.crypto_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-white">Bitcoin Address</Label>
                      <Input
                        placeholder="1A1z7agoat..."
                        value={paymentSettings.crypto_bitcoin_address}
                        onChange={(e) => 
                          setPaymentSettings(prev => ({ ...prev, crypto_bitcoin_address: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Ethereum Address</Label>
                      <Input
                        placeholder="0x..."
                        value={paymentSettings.crypto_ethereum_address}
                        onChange={(e) => 
                          setPaymentSettings(prev => ({ ...prev, crypto_ethereum_address: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono text-sm"
                      />
                    </div>

                    {/* Crypto Payment Form Preview */}
                    <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                      <p className="text-sm text-slate-300 mb-3 font-semibold">Crypto Payment Options</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-slate-600/50 rounded">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">₿</div>
                          <div className="flex-1">
                            <p className="text-sm text-white">Bitcoin</p>
                            <p className="text-xs text-slate-400 truncate">{paymentSettings.crypto_bitcoin_address || 'Not configured'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-600/50 rounded">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Ξ</div>
                          <div className="flex-1">
                            <p className="text-sm text-white">Ethereum</p>
                            <p className="text-xs text-slate-400 truncate">{paymentSettings.crypto_ethereum_address || 'Not configured'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={savePaymentSettings}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Payment Settings'
            )}
          </Button>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                Telegram Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-white">Enable Telegram Bot</Label>
                <Switch
                  checked={paymentSettings.telegram_enabled}
                  onCheckedChange={(checked) => 
                    setPaymentSettings(prev => ({ ...prev, telegram_enabled: checked }))
                  }
                />
              </div>

              {paymentSettings.telegram_enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Notifications</Label>
                    <Switch
                      checked={paymentSettings.telegram_notifications_enabled}
                      onCheckedChange={(checked) => 
                        setPaymentSettings(prev => ({ ...prev, telegram_notifications_enabled: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Bot Token</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.telegram_token ? "text" : "password"}
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        value={paymentSettings.telegram_bot_token}
                        onChange={(e) => 
                          setPaymentSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSecretVisibility('telegram_token')}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        {showSecrets.telegram_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Chat ID</Label>
                    <Input
                      placeholder="123456789"
                      value={paymentSettings.telegram_chat_id}
                      onChange={(e) => 
                        setPaymentSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))
                      }
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    />
                  </div>

                  <Alert className="bg-blue-900/20 border-blue-700">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-400">
                      Get your bot token from @BotFather on Telegram. Chat ID is your Telegram user ID.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Button
                onClick={savePaymentSettings}
                disabled={saving}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Telegram Settings'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Max Links Per User</Label>
                <Input
                  type="number"
                  value={systemSettings.max_links_per_user}
                  onChange={(e) => 
                    setSystemSettings(prev => ({ ...prev, max_links_per_user: parseInt(e.target.value) }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Max Campaigns Per User</Label>
                <Input
                  type="number"
                  value={systemSettings.max_campaigns_per_user}
                  onChange={(e) => 
                    setSystemSettings(prev => ({ ...prev, max_campaigns_per_user: parseInt(e.target.value) }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Data Retention (Days)</Label>
                <Input
                  type="number"
                  value={systemSettings.retention_days}
                  onChange={(e) => 
                    setSystemSettings(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white">Enable Email Capture</Label>
                <Switch
                  checked={systemSettings.enable_email_capture}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, enable_email_capture: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white">Enable Analytics</Label>
                <Switch
                  checked={systemSettings.enable_analytics}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, enable_analytics: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white">Enable Custom Domains</Label>
                <Switch
                  checked={systemSettings.enable_custom_domains}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, enable_custom_domains: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white">Maintenance Mode</Label>
                <Switch
                  checked={systemSettings.maintenance_mode}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, maintenance_mode: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white">Enable Registrations</Label>
                <Switch
                  checked={systemSettings.enable_registrations}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, enable_registrations: checked }))
                  }
                />
              </div>

              <Button
                onClick={saveSystemSettings}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save System Settings'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  Security settings are managed in the Admin Panel under the Security tab.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Security Checklist</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-slate-300">HTTPS enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-slate-300">Database encryption enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-slate-300">API authentication required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-slate-300">Rate limiting enabled</span>
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

export default Settings

