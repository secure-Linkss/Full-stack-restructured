import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { CreditCard, MessageSquare, Settings, Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff, Wallet, Copy } from 'lucide-react'
import { toast } from 'sonner'

const Settings = () => {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('payments')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showSecrets, setShowSecrets] = useState({})
  const [adminPaymentConfig, setAdminPaymentConfig] = useState(null)

  // User Payment Settings
  const [userPaymentSettings, setUserPaymentSettings] = useState({
    preferred_payment_method: 'card', // 'card' or 'crypto'
    stripe_customer_id: '',
    crypto_wallet_address: '',
  })

  // Admin Payment Settings (for configuration)
  const [adminPaymentSettings, setAdminPaymentSettings] = useState({
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_price_id: '',
    crypto_enabled: false,
    crypto_bitcoin_address: '',
    crypto_ethereum_address: '',
    crypto_accepted_coins: ['BTC', 'ETH'],
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
    fetchUserAndSettings()
  }, [])

  const fetchUserAndSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current user
      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }

      // Fetch user payment settings
      try {
        const paymentRes = await fetch('/api/settings/user-payments')
        if (paymentRes.ok) {
          const data = await paymentRes.json()
          setUserPaymentSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching user payment settings:', e)
      }

      // Fetch admin payment config (if user is admin)
      try {
        const adminRes = await fetch('/api/admin/payment-config')
        if (adminRes.ok) {
          const data = await adminRes.json()
          setAdminPaymentConfig(data)
          setAdminPaymentSettings(prev => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Error fetching admin payment config:', e)
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

  const saveUserPaymentSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings/user-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPaymentSettings)
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

  const saveAdminPaymentSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminPaymentSettings)
      })

      if (!response.ok) throw new Error('Failed to save admin payment settings')
      
      toast.success('Admin payment settings saved successfully')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving admin payment settings:', error)
      toast.error('Failed to save admin payment settings')
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-700 rounded w-1/3"></div>
          <div className="h-96 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'main_admin'

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-sm sm:text-base">Manage your account, payments, and preferences</p>
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
          {/* User Payment Methods Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-400" />
                Your Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred Payment Method */}
              <div className="space-y-3">
                <Label className="text-white font-semibold">Select Preferred Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Payment Option */}
                  <div
                    onClick={() => setUserPaymentSettings(prev => ({ ...prev, preferred_payment_method: 'card' }))}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userPaymentSettings.preferred_payment_method === 'card'
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <h3 className="text-white font-semibold">Credit/Debit Card</h3>
                    </div>
                    <p className="text-slate-300 text-sm">Pay with Stripe (Visa, Mastercard, etc.)</p>
                  </div>

                  {/* Crypto Payment Option */}
                  <div
                    onClick={() => setUserPaymentSettings(prev => ({ ...prev, preferred_payment_method: 'crypto' }))}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userPaymentSettings.preferred_payment_method === 'crypto'
                        ? 'border-orange-500 bg-orange-900/20'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="h-5 w-5 text-orange-400" />
                      <h3 className="text-white font-semibold">Cryptocurrency</h3>
                    </div>
                    <p className="text-slate-300 text-sm">Pay with Bitcoin or Ethereum</p>
                  </div>
                </div>
              </div>

              {/* Card Payment Section */}
              {userPaymentSettings.preferred_payment_method === 'card' && (
                <div className="border border-slate-600 rounded-lg p-6 bg-slate-700/30 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    Card Payment Form
                  </h3>

                  <div className="space-y-4">
                    {/* Cardholder Name */}
                    <div className="space-y-2">
                      <Label className="text-white">Cardholder Name</Label>
                      <Input
                        placeholder="John Doe"
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                      <Label className="text-white">Card Number</Label>
                      <Input
                        placeholder="4242 4242 4242 4242"
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono"
                      />
                    </div>

                    {/* Expiry and CVC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">CVC</Label>
                        <Input
                          placeholder="123"
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-2">
                      <Label className="text-white">Billing Address</Label>
                      <Input
                        placeholder="123 Main St, City, State 12345"
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>

                    {/* Payment Button */}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay with Card
                    </Button>
                  </div>
                </div>
              )}

              {/* Crypto Payment Section */}
              {userPaymentSettings.preferred_payment_method === 'crypto' && adminPaymentConfig?.crypto_enabled && (
                <div className="border border-slate-600 rounded-lg p-6 bg-slate-700/30 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-orange-400" />
                    Cryptocurrency Payment
                  </h3>

                  <Alert className="bg-blue-900/20 border-blue-700">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-400">
                      Send the exact amount to the wallet address below. Your payment will be confirmed after blockchain verification.
                    </AlertDescription>
                  </Alert>

                  {/* Bitcoin Payment Option */}
                  {adminPaymentConfig?.crypto_bitcoin_address && (
                    <div className="border border-orange-600/50 rounded-lg p-4 bg-orange-900/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">₿</div>
                        <div>
                          <h4 className="text-white font-semibold">Bitcoin</h4>
                          <p className="text-slate-400 text-sm">Send BTC to this address</p>
                        </div>
                      </div>

                      <div className="bg-slate-700 rounded p-3 mb-3 font-mono text-sm text-slate-300 break-all">
                        {adminPaymentConfig.crypto_bitcoin_address}
                      </div>

                      <Button
                        onClick={() => copyToClipboard(adminPaymentConfig.crypto_bitcoin_address, 'Bitcoin address')}
                        variant="outline"
                        className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Address
                      </Button>

                      <div className="mt-3 space-y-2">
                        <Label className="text-white text-sm">Amount to Send (BTC)</Label>
                        <Input
                          placeholder="0.00000000"
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ethereum Payment Option */}
                  {adminPaymentConfig?.crypto_ethereum_address && (
                    <div className="border border-purple-600/50 rounded-lg p-4 bg-purple-900/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">Ξ</div>
                        <div>
                          <h4 className="text-white font-semibold">Ethereum</h4>
                          <p className="text-slate-400 text-sm">Send ETH to this address</p>
                        </div>
                      </div>

                      <div className="bg-slate-700 rounded p-3 mb-3 font-mono text-sm text-slate-300 break-all">
                        {adminPaymentConfig.crypto_ethereum_address}
                      </div>

                      <Button
                        onClick={() => copyToClipboard(adminPaymentConfig.crypto_ethereum_address, 'Ethereum address')}
                        variant="outline"
                        className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Address
                      </Button>

                      <div className="mt-3 space-y-2">
                        <Label className="text-white text-sm">Amount to Send (ETH)</Label>
                        <Input
                          placeholder="0.00000000"
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                    <p className="text-white font-semibold mb-2">Payment Status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-slate-300 text-sm">Waiting for payment...</span>
                      </div>
                      <p className="text-slate-400 text-xs">Payments are usually confirmed within 10-30 minutes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Crypto Config Alert */}
              {userPaymentSettings.preferred_payment_method === 'crypto' && !adminPaymentConfig?.crypto_enabled && (
                <Alert className="bg-yellow-900/20 border-yellow-700">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-400">
                    Cryptocurrency payments are not currently enabled. Please contact support or use card payment instead.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={saveUserPaymentSettings}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Payment Preference'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Payment Configuration Section */}
          {isAdmin && (
            <Card className="bg-slate-800 border-red-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  Admin: Payment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stripe Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-semibold">Enable Stripe</Label>
                      <Switch
                        checked={adminPaymentSettings.stripe_enabled}
                        onCheckedChange={(checked) => 
                          setAdminPaymentSettings(prev => ({ ...prev, stripe_enabled: checked }))
                        }
                      />
                    </div>

                    {adminPaymentSettings.stripe_enabled && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-white text-sm">Publishable Key</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showSecrets.stripe_pub ? "text" : "password"}
                              placeholder="pk_live_..."
                              value={adminPaymentSettings.stripe_publishable_key}
                              onChange={(e) => 
                                setAdminPaymentSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))
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
                          <Label className="text-white text-sm">Secret Key</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showSecrets.stripe_secret ? "text" : "password"}
                              placeholder="sk_live_..."
                              value={adminPaymentSettings.stripe_secret_key}
                              onChange={(e) => 
                                setAdminPaymentSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))
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
                          <Label className="text-white text-sm">Price ID</Label>
                          <Input
                            placeholder="price_..."
                            value={adminPaymentSettings.stripe_price_id}
                            onChange={(e) => 
                              setAdminPaymentSettings(prev => ({ ...prev, stripe_price_id: e.target.value }))
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Crypto Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-semibold">Enable Crypto</Label>
                      <Switch
                        checked={adminPaymentSettings.crypto_enabled}
                        onCheckedChange={(checked) => 
                          setAdminPaymentSettings(prev => ({ ...prev, crypto_enabled: checked }))
                        }
                      />
                    </div>

                    {adminPaymentSettings.crypto_enabled && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-white text-sm">Bitcoin Address</Label>
                          <Input
                            placeholder="1A1z7agoat..."
                            value={adminPaymentSettings.crypto_bitcoin_address}
                            onChange={(e) => 
                              setAdminPaymentSettings(prev => ({ ...prev, crypto_bitcoin_address: e.target.value }))
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">Ethereum Address</Label>
                          <Input
                            placeholder="0x..."
                            value={adminPaymentSettings.crypto_ethereum_address}
                            onChange={(e) => 
                              setAdminPaymentSettings(prev => ({ ...prev, crypto_ethereum_address: e.target.value }))
                            }
                            className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 font-mono text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={saveAdminPaymentSettings}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Admin Payment Configuration'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
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
              {isAdmin ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Telegram Bot</Label>
                    <Switch
                      checked={adminPaymentSettings.telegram_enabled}
                      onCheckedChange={(checked) => 
                        setAdminPaymentSettings(prev => ({ ...prev, telegram_enabled: checked }))
                      }
                    />
                  </div>

                  {adminPaymentSettings.telegram_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">Bot Token</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecrets.telegram_token ? "text" : "password"}
                            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            value={adminPaymentSettings.telegram_bot_token}
                            onChange={(e) => 
                              setAdminPaymentSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))
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
                          value={adminPaymentSettings.telegram_chat_id}
                          onChange={(e) => 
                            setAdminPaymentSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))
                          }
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                        />
                      </div>

                      <Button
                        onClick={saveAdminPaymentSettings}
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
                    </>
                  )}
                </>
              ) : (
                <Alert className="bg-blue-900/20 border-blue-700">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-400">
                    Telegram integration is managed by administrators. Contact your admin for configuration.
                  </AlertDescription>
                </Alert>
              )}
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
              {isAdmin ? (
                <>
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

                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Email Capture</Label>
                    <Switch
                      checked={systemSettings.enable_email_capture}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, enable_email_capture: checked }))
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
                </>
              ) : (
                <Alert className="bg-blue-900/20 border-blue-700">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-400">
                    System settings are managed by administrators only.
                  </AlertDescription>
                </Alert>
              )}
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
                <h3 className="text-white font-semibold">Security Status</h3>
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

