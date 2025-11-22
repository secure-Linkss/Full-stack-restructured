import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Settings, Save, Mail, CreditCard, Globe, Code, AlertTriangle, Loader } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import DomainManagementTab from './DomainManagementTab';
import api from '../../services/api';

// --- Sub-Components for Settings Tabs ---

const GeneralSettings = ({ settings, setSettings, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Platform Identity</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" value={settings.companyName || ''} onChange={(e) => setSettings('companyName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
          <Input id="companyLogoUrl" value={settings.companyLogoUrl || ''} onChange={(e) => setSettings('companyLogoUrl', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode || false}
            onCheckedChange={(checked) => setSettings('maintenanceMode', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="enableRegistrations">Enable New Registrations</Label>
          <Switch
            id="enableRegistrations"
            checked={settings.enableRegistrations !== false}
            onCheckedChange={(checked) => setSettings('enableRegistrations', checked)}
          />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end">
      <Button onClick={() => handleSave('general')} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save General Settings
      </Button>
    </div>
  </div>
);

const EmailSettings = ({ settings, setSettings, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="smtpEnabled">Enable SMTP</Label>
          <Switch
            id="smtpEnabled"
            checked={settings.smtpEnabled || false}
            onCheckedChange={(checked) => setSettings('smtpEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input id="smtpHost" value={settings.smtpHost || ''} onChange={(e) => setSettings('smtpHost', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input id="smtpPort" type="number" value={settings.smtpPort || 587} onChange={(e) => setSettings('smtpPort', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpUser">SMTP Username</Label>
          <Input id="smtpUser" value={settings.smtpUser || ''} onChange={(e) => setSettings('smtpUser', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpPassword">SMTP Password</Label>
          <Input id="smtpPassword" type="password" value={settings.smtpPassword || ''} onChange={(e) => setSettings('smtpPassword', e.target.value)} placeholder="••••••••" />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end space-x-3">
      <Button variant="outline" onClick={() => toast.info('Test email feature coming soon')}>Test SMTP</Button>
      <Button onClick={() => handleSave('email')} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Email Settings
      </Button>
    </div>
  </div>
);

const PaymentSettings = ({ settings, setSettings, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Stripe Gateway</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="stripeEnabled">Enable Stripe</Label>
          <Switch
            id="stripeEnabled"
            checked={settings.stripeEnabled || false}
            onCheckedChange={(checked) => setSettings('stripeEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
          <Input id="stripePublishableKey" type="password" value={settings.stripePublishableKey || ''} onChange={(e) => setSettings('stripePublishableKey', e.target.value)} placeholder="pk_..." />
        </div>
        <div>
          <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
          <Input id="stripeSecretKey" type="password" value={settings.stripeSecretKey || ''} onChange={(e) => setSettings('stripeSecretKey', e.target.value)} placeholder="sk_..." />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>PayPal Gateway</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="paypalEnabled">Enable PayPal</Label>
          <Switch
            id="paypalEnabled"
            checked={settings.paypalEnabled || false}
            onCheckedChange={(checked) => setSettings('paypalEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="paypalClientId">PayPal Client ID</Label>
          <Input id="paypalClientId" type="password" value={settings.paypalClientId || ''} onChange={(e) => setSettings('paypalClientId', e.target.value)} placeholder="AZY..." />
        </div>
        <div>
          <Label htmlFor="paypalSecret">PayPal Secret</Label>
          <Input id="paypalSecret" type="password" value={settings.paypalSecret || ''} onChange={(e) => setSettings('paypalSecret', e.target.value)} placeholder="EGH..." />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end">
      <Button onClick={() => handleSave('payment')} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  </div>
);

const CDNStorageSettings = ({ settings, setSettings, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>AWS S3 Storage</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="s3Enabled">Enable S3 Storage</Label>
          <Switch
            id="s3Enabled"
            checked={settings.s3Enabled || false}
            onCheckedChange={(checked) => setSettings('s3Enabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="s3BucketName">S3 Bucket Name</Label>
          <Input id="s3BucketName" value={settings.s3BucketName || ''} onChange={(e) => setSettings('s3BucketName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="s3Region">S3 Region</Label>
          <Input id="s3Region" value={settings.s3Region || ''} onChange={(e) => setSettings('s3Region', e.target.value)} placeholder="us-east-1" />
        </div>
        <div>
          <Label htmlFor="s3AccessKeyId">S3 Access Key ID</Label>
          <Input id="s3AccessKeyId" type="password" value={settings.s3AccessKeyId || ''} onChange={(e) => setSettings('s3AccessKeyId', e.target.value)} placeholder="AKIA..." />
        </div>
        <div>
          <Label htmlFor="s3SecretAccessKey">S3 Secret Access Key</Label>
          <Input id="s3SecretAccessKey" type="password" value={settings.s3SecretAccessKey || ''} onChange={(e) => setSettings('s3SecretAccessKey', e.target.value)} placeholder="wJalr..." />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end">
      <Button onClick={() => handleSave('cdn')} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save CDN/Storage Settings
      </Button>
    </div>
  </div>
);

const APISettings = ({ settings, setSettings, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Telegram Integration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="telegramEnabled">Enable Telegram Notifications</Label>
          <Switch
            id="telegramEnabled"
            checked={settings.telegramEnabled || false}
            onCheckedChange={(checked) => setSettings('telegramEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
          <Input id="telegramBotToken" type="password" value={settings.telegramBotToken || ''} onChange={(e) => setSettings('telegramBotToken', e.target.value)} placeholder="123456:ABC-DEF..." />
        </div>
        <div>
          <Label htmlFor="telegramChatId">Default Chat ID</Label>
          <Input id="telegramChatId" value={settings.telegramChatId || ''} onChange={(e) => setSettings('telegramChatId', e.target.value)} placeholder="-100123456789" />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end space-x-3">
      <Button variant="outline" onClick={() => toast.info('Test Telegram feature coming soon')}>Test Telegram</Button>
      <Button onClick={() => handleSave('api')} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save API Settings
      </Button>
    </div>
  </div>
);

// --- Main Admin Settings Component ---

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/settings');
      setSettings(response.data || {});
    } catch (error) {
      console.error('Failed to load admin settings:', error);
      toast.error('Failed to load system settings. Using defaults.');
      // Set default settings on error
      setSettings({
        companyName: 'Brain Link Tracker Pro',
        companyLogoUrl: '',
        maintenanceMode: false,
        enableRegistrations: true,
        smtpEnabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        stripeEnabled: false,
        stripePublishableKey: '',
        stripeSecretKey: '',
        paypalEnabled: false,
        paypalClientId: '',
        paypalSecret: '',
        s3Enabled: false,
        s3BucketName: '',
        s3Region: 'us-east-1',
        s3AccessKeyId: '',
        s3SecretAccessKey: '',
        telegramEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      await api.put('/api/admin/settings', settings);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully.`);
    } catch (error) {
      console.error(`Failed to save ${section} settings:`, error);
      toast.error(`Failed to save ${section} settings. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-10 flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading System Settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Settings className="h-5 w-5 mr-2 text-primary" /> System Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Configure global application settings and external integrations.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2" /> General</TabsTrigger>
            <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" /> Email</TabsTrigger>
            <TabsTrigger value="payment"><CreditCard className="h-4 w-4 mr-2" /> Payment</TabsTrigger>
            <TabsTrigger value="cdn"><Globe className="h-4 w-4 mr-2" /> CDN/Storage</TabsTrigger>
            <TabsTrigger value="api"><Code className="h-4 w-4 mr-2" /> API/Integrations</TabsTrigger>
            <TabsTrigger value="domains"><Globe className="h-4 w-4 mr-2" /> Domains</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general">
              <GeneralSettings settings={settings} setSettings={updateSetting} saving={saving} handleSave={handleSave} />
            </TabsContent>
            <TabsContent value="email">
              <EmailSettings settings={settings} setSettings={updateSetting} saving={saving} handleSave={handleSave} />
            </TabsContent>
            <TabsContent value="payment">
              <PaymentSettings settings={settings} setSettings={updateSetting} saving={saving} handleSave={handleSave} />
            </TabsContent>
            <TabsContent value="cdn">
              <CDNStorageSettings settings={settings} setSettings={updateSetting} saving={saving} handleSave={handleSave} />
            </TabsContent>
            <TabsContent value="api">
              <APISettings settings={settings} setSettings={updateSetting} saving={saving} handleSave={handleSave} />
            </TabsContent>
            <TabsContent value="domains">
              <DomainManagementTab />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;