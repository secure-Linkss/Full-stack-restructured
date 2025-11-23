import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings as SettingsIcon, User, Lock, CreditCard, Bell, Code, Trash2, Palette, TestTube, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import api from '../services/api';

// --- Placeholder Components for Settings Sections ---

const AccountSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><User className="h-5 w-5 mr-2 text-primary" /> Account Information</CardTitle>
      <p className="text-sm text-muted-foreground">Update your personal details and email address.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Placeholder Form */}
      <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
        [Account Details Form]
      </div>
      <Button onClick={() => toast.info('Account details saved (Mock)')}>Save Changes</Button>
    </CardContent>
  </Card>
);

const SecuritySettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><Lock className="h-5 w-5 mr-2 text-primary" /> Security & Password</CardTitle>
      <p className="text-sm text-muted-foreground">Change your password and enable two-factor authentication.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Placeholder Form */}
      <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
        [Password Change and 2FA Settings]
      </div>
      <Button onClick={() => toast.info('Security settings saved (Mock)')}>Save Changes</Button>
    </CardContent>
  </Card>
);

const BillingSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2 text-primary" /> Billing & Subscription</CardTitle>
      <p className="text-sm text-muted-foreground">Manage your payment methods and view your billing history.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Placeholder Content */}
      <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
        [Subscription Details and Invoice List]
      </div>
      <Button onClick={() => toast.info('Redirecting to billing portal (Mock)')} variant="outline">Manage Subscription</Button>
    </CardContent>
  </Card>
);

	const NotificationSettings = () => {
	  const [settings, setSettings] = useState({
	    telegram_enabled: false,
	    telegram_bot_token: '',
	    telegram_chat_id: '',
	    notification_types: {
	      campaign_alerts: true,
	      link_clicks: false,
	      security_threats: true,
	      bot_detections: true,
	      captured_data: true
	    },
	    notification_frequency: 'realtime'
	  });
	  const [loading, setLoading] = useState(true);
	  const [saving, setSaving] = useState(false);
	  const [testing, setTesting] = useState(false);
	  const [testStatus, setTestStatus] = useState(null);
	
	  useEffect(() => {
	    fetchSettings();
	  }, []);
	
	  const fetchSettings = async () => {
	    try {
	      const response = await api.settings.get();
	      setSettings({
	        telegram_enabled: response.telegram_enabled || false,
	        telegram_bot_token: response.telegram_bot_token || '',
	        telegram_chat_id: response.telegram_chat_id || '',
	        notification_types: response.notification_types || {
	          campaign_alerts: true,
	          link_clicks: false,
	          security_threats: true,
	          bot_detections: true,
	          captured_data: true
	        },
	        notification_frequency: response.notification_frequency || 'realtime'
	      });
	    } catch (error) {
	      console.error('Failed to load notification settings:', error);
	    } finally {
	      setLoading(false);
	    }
	  };
	
	  const handleSave = async () => {
	    setSaving(true);
	    try {
	      await api.settings.update(settings);
	      toast.success('Notification settings saved successfully!');
	    } catch (error) {
	      toast.error(`Failed to save settings: ${error.message}`);
	    } finally {
	      setSaving(false);
	    }
	  };
	
	  const handleTestNotification = async () => {
	    setTesting(true);
	    setTestStatus(null);
	    try {
	      toast.info('Sending test notification...');
	      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
	      const response = await fetch('/api/user/telegram/test', {
	        method: 'POST',
	        headers: {
	          'Content-Type': 'application/json',
	          'Authorization': `Bearer ${token}`
	        },
	        body: JSON.stringify({
	          botToken: settings.telegram_bot_token,
	          chatId: settings.telegram_chat_id
	        })
	      });
	
	      if (response.ok) {
	        setTestStatus('success');
	        toast.success('Test notification sent! Check your Telegram.');
	      } else {
	        setTestStatus('error');
	        toast.error('Failed to send test notification. Check your token and chat ID.');
	      }
	    } catch (error) {
	      setTestStatus('error');
	      toast.error('Failed to send test notification.');
	    } finally {
	      setTesting(false);
	    }
	  };
	
	  if (loading) {
	    return <div className="text-center p-4">Loading...</div>;
	  }
	
	  return (
	    <Card>
	      <CardHeader>
	        <CardTitle className="flex items-center">
	          <Bell className="h-5 w-5 mr-2 text-primary" /> 
	          Notification Settings
	        </CardTitle>
	        <p className="text-sm text-muted-foreground">
	          Configure how you receive alerts and updates via Telegram.
	        </p>
	      </CardHeader>
	      <CardContent className="space-y-6">
	        {/* Telegram Integration */}
	        <div className="space-y-4">
	          <div className="flex items-center justify-between">
	            <Label htmlFor="telegram_enabled">Enable Telegram Notifications</Label>
	            <Switch
	              id="telegram_enabled"
	              checked={settings.telegram_enabled}
	              onCheckedChange={(checked) => setSettings({ ...settings, telegram_enabled: checked })}
	            />
	          </div>
	          
	          {settings.telegram_enabled && (
	            <>
	              <div>
	                <Label htmlFor="telegram_bot_token">Telegram Bot Token</Label>
	                <Input
	                  id="telegram_bot_token"
	                  type="password"
	                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	                  value={settings.telegram_bot_token}
	                  onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
	                />
	                <p className="text-xs text-muted-foreground mt-1">
	                  Get your bot token from @BotFather on Telegram
	                </p>
	              </div>
	              
	              <div>
	                <Label htmlFor="telegram_chat_id">Telegram Chat ID</Label>
	                <Input
	                  id="telegram_chat_id"
	                  placeholder="-100123456789 or 123456789"
	                  value={settings.telegram_chat_id}
	                  onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
	                />
	                <p className="text-xs text-muted-foreground mt-1">
	                  Your personal chat ID or group chat ID
	                </p>
	              </div>
	
	              <div className="flex items-center space-x-3">
	                <Button 
	                  variant="outline" 
	                  onClick={handleTestNotification} 
	                  disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
	                >
	                  <TestTube className="h-4 w-4 mr-2" />
	                  {testing ? 'Testing...' : 'Test Connection'}
	                </Button>
	                {testStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
	                {testStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
	              </div>
	            </>
	          )}
	        </div>
	
	        {/* Notification Types */}
	        {settings.telegram_enabled && (
	          <div className="space-y-4">
	            <Label>Notification Types</Label>
	            
	            <div className="flex items-center justify-between">
	              <div>
	                <p className="font-medium">Campaign Performance Alerts</p>
	                <p className="text-sm text-muted-foreground">Get notified about campaign milestones</p>
	              </div>
	              <Switch
	                checked={settings.notification_types.campaign_alerts}
	                onCheckedChange={(checked) => setSettings({
	                  ...settings,
	                  notification_types: { ...settings.notification_types, campaign_alerts: checked }
	                })}
	              />
	            </div>
	            
	            <div className="flex items-center justify-between">
	              <div>
	                <p className="font-medium">Link Click Notifications</p>
	                <p className="text-sm text-muted-foreground">Real-time alerts for every link click</p>
	              </div>
	              <Switch
	                checked={settings.notification_types.link_clicks}
	                onCheckedChange={(checked) => setSettings({
	                  ...settings,
	                  notification_types: { ...settings.notification_types, link_clicks: checked }
	                })}
	              />
	            </div>
	            
	            <div className="flex items-center justify-between">
	              <div>
	                <p className="font-medium">Security Threat Alerts</p>
	                <p className="text-sm text-muted-foreground">Warnings about suspicious activity</p>
	              </div>
	              <Switch
	                checked={settings.notification_types.security_threats}
	                onCheckedChange={(checked) => setSettings({
	                  ...settings,
	                  notification_types: { ...settings.notification_types, security_threats: checked }
	                })}
	              />
	            </div>
	            
	            <div className="flex items-center justify-between">
	              <div>
	                <p className="font-medium">Bot Detection Alerts</p>
	                <p className="text-sm text-muted-foreground">Notifications when bots are blocked</p>
	              </div>
	              <Switch
	                checked={settings.notification_types.bot_detections}
	                onCheckedChange={(checked) => setSettings({
	                  ...settings,
	                  notification_types: { ...settings.notification_types, bot_detections: checked }
	                })}
	              />
	            </div>
	            
	            <div className="flex items-center justify-between">
	              <div>
	                <p className="font-medium">Captured Data Notifications</p>
	                <p className="text-sm text-muted-foreground">Alerts when emails are captured</p>
	              </div>
	              <Switch
	                checked={settings.notification_types.captured_data}
	                onCheckedChange={(checked) => setSettings({
	                  ...settings,
	                  notification_types: { ...settings.notification_types, captured_data: checked }
	                })}
	              />
	            </div>
	          </div>
	        )}
	
	        {/* Actions */}
	        <div className="flex space-x-3">
	          <Button onClick={handleSave} disabled={saving}>
	            {saving ? 'Saving...' : 'Save Changes'}
	          </Button>
	        </div>
	      </CardContent>
	    </Card>
	  );
	};

const ApiSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><Code className="h-5 w-5 mr-2 text-primary" /> API Access</CardTitle>
      <p className="text-sm text-muted-foreground">Generate and manage your API keys for external integrations.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Placeholder Content */}
      <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
        [API Key Management Table and Button]
      </div>
      <Button onClick={() => toast.info('New API key generated (Mock)')}>Generate New Key</Button>
    </CardContent>
  </Card>
);

const DangerZone = () => (
  <Card className="border-red-500/50 bg-red-500/10">
    <CardHeader>
      <CardTitle className="flex items-center text-red-400"><Trash2 className="h-5 w-5 mr-2" /> Danger Zone</CardTitle>
      <p className="text-sm text-muted-foreground">Irreversible actions that will affect your account.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center p-3 border border-red-500/50 rounded-lg">
        <div>
          <p className="font-medium text-foreground">Delete Account</p>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        </div>
        <Button variant="destructive" onClick={() => toast.error('Account deletion initiated (Mock)')}>Delete Account</Button>
      </div>
    </CardContent>
  </Card>
);

// --- Appearance Settings Component ---
const AppearanceSettings = () => {
  const [theme, setTheme] = useState('system'); // Placeholder for actual theme state
  const [loading, setLoading] = useState(false);

  // Mock function to simulate theme change
  const handleThemeChange = (newTheme) => {
    setLoading(true);
    setTimeout(() => {
      setTheme(newTheme);
      // Mock background change logic here
      toast.success(`Theme set to ${newTheme}.`);
      setLoading(false);
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Palette className="h-5 w-5 mr-2 text-primary" /> Appearance</CardTitle>
        <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard, including background changes.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex space-x-4">
            <Button 
              variant={theme === 'light' ? 'default' : 'outline'} 
              onClick={() => handleThemeChange('light')}
              disabled={loading}
            >
              Light
            </Button>
            <Button 
              variant={theme === 'dark' ? 'default' : 'outline'} 
              onClick={() => handleThemeChange('dark')}
              disabled={loading}
            >
              Dark
            </Button>
            <Button 
              variant={theme === 'system' ? 'default' : 'outline'} 
              onClick={() => handleThemeChange('system')}
              disabled={loading}
            >
              System
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Select a theme for the dashboard. This will also control the background.</p>
        </div>
        
        {/* Placeholder for more advanced background settings */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Advanced Background</Label>
          <div className="h-16 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            [Placeholder for Custom Background Image/Color Picker]
          </div>
          <p className="text-xs text-muted-foreground">Upload a custom background or select a color palette.</p>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Settings Component ---

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

	  const settingsTabs = [
	    { id: 'account', title: 'Account', icon: User, component: AccountSettings },
	    { id: 'appearance', title: 'Appearance', icon: Palette, component: AppearanceSettings },
	    { id: 'security', title: 'Security', icon: Lock, component: SecuritySettings },
	    { id: 'billing', title: 'Billing', icon: CreditCard, component: BillingSettings },
	    { id: 'notifications', title: 'Notifications', icon: Bell, component: NotificationSettings },
	    { id: 'api', title: 'API Access', icon: Code, component: ApiSettings },
	    { id: 'danger', title: 'Danger Zone', icon: Trash2, component: DangerZone },
	  ];

  const ActiveComponent = settingsTabs.find(tab => tab.id === activeTab)?.component || AccountSettings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Settings"
        description="Manage your account, security, billing, and preferences"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {settingsTabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.title}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Settings;
