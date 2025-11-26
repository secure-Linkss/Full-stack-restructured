import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Mail, CreditCard, Globe, Code, AlertTriangle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
	import DomainManagementTab from './DomainManagementTab';
	import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
	import { Trash2, Database, AlertCircle } from 'lucide-react';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import api from '../../services/api';
import CryptoPaymentSettings from './CryptoPaymentSettings';

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

    <CryptoPaymentSettings />

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

	const SystemSettings = ({ dashboardStats, loadingStats }) => {
	  const [confirmText, setConfirmText] = useState('');
	  const [systemDeleteDialog, setSystemDeleteDialog] = useState(false);
	  const [deleting, setDeleting] = useState(false);
	
	  const deleteAllSystemData = async () => {
	    if (confirmText !== 'DELETE ALL DATA') {
	      toast.error('Please type "DELETE ALL DATA" to confirm');
	      return;
	    }
	
	    setDeleting(true);
	    try {
	      await api.admin.deleteAllData();
	      toast.success('All system data deleted successfully.');
	      setSystemDeleteDialog(false);
	      setConfirmText('');
	      // Optionally refresh stats
	    } catch (error) {
	      toast.error('Failed to delete system data.');
	    } finally {
	      setDeleting(false);
	    }
	  };
	
	  return (
	    <div className="space-y-6">
	      <Card>
	        <CardHeader>
	          <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> Danger Zone</CardTitle>
	          <p className="text-sm text-muted-foreground">Irreversible system-wide actions.</p>
	        </CardHeader>
	        <CardContent>
	          <Dialog open={systemDeleteDialog} onOpenChange={setSystemDeleteDialog}>
	            <DialogTrigger asChild>
	              <Button variant="destructive" className="w-full">
	                <Trash2 className="h-4 w-4 mr-2" />
	                Delete All System Data
	              </Button>
	            </DialogTrigger>
	            <DialogContent>
	              <DialogHeader>
	                <DialogTitle className="text-red-500">Confirm Deletion</DialogTitle>
	                <DialogDescription>
	                  This action is permanent and cannot be undone. All user data, links, and logs will be deleted. Type "DELETE ALL DATA" to confirm.
	                </DialogDescription>
	              </DialogHeader>
	              <Input
	                value={confirmText}
	                onChange={(e) => setConfirmText(e.target.value)}
	                placeholder='Type "DELETE ALL DATA" to confirm'
	              />
	              <div className="flex justify-end space-x-2">
	                <Button variant="outline" onClick={() => setSystemDeleteDialog(false)}>Cancel</Button>
	                <Button onClick={deleteAllSystemData} variant="destructive" disabled={confirmText !== 'DELETE ALL DATA' || deleting}>
	                  {deleting ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
	                  {deleting ? 'Deleting...' : 'Delete All Data'}
	                </Button>
	              </div>
	            </DialogContent>
	          </Dialog>
	        </CardContent>
	      </Card>
	
	      <Card>
	        <CardHeader>
	          <CardTitle className="flex items-center"><Database className="h-5 w-5 mr-2 text-primary" /> Database Info</CardTitle>
	          <p className="text-sm text-muted-foreground">Current statistics on database usage.</p>
	        </CardHeader>
	        <CardContent className="space-y-3">
	          {loadingStats ? (
	            <div className="flex items-center justify-center h-20">
	              <Loader className="h-6 w-6 animate-spin text-primary" />
	            </div>
	          ) : (
	            <>
	              <div className="flex justify-between border-b pb-2">
	                <span className="font-medium">Total Users:</span>
	                <span>{dashboardStats.totalUsers?.toLocaleString() || 0}</span>
	              </div>
	              <div className="flex justify-between border-b pb-2">
	                <span className="font-medium">Total Links:</span>
	                <span>{dashboardStats.totalLinks?.toLocaleString() || 0}</span>
	              </div>
	              <div className="flex justify-between">
	                <span className="font-medium">Total Clicks:</span>
	                <span>{dashboardStats.totalClicks?.toLocaleString() || 0}</span>
	              </div>
	            </>
	          )}
	        </CardContent>
	      </Card>
	    </div>
	  );
	};
	
	const AdminSettings = () => {
	  const [settings, setSettings] = useState({});
	  const [dashboardStats, setDashboardStats] = useState({});
	  const [loading, setLoading] = useState(true);
	  const [loadingStats, setLoadingStats] = useState(true);
	  const [saving, setSaving] = useState(false);
	
	  const fetchDashboardStats = async () => {
	    setLoadingStats(true);
	    try {
	      const response = await api.get('/api/admin/dashboard');
	      setDashboardStats(response.data || {});
	    } catch (error) {
	      console.error('Failed to load dashboard stats:', error);
	    } finally {
	      setLoadingStats(false);
	    }
	  };
	
	  useEffect(() => {
	    fetchSettings();
	    fetchDashboardStats();
	  }, []);

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1 overflow-x-auto">
            <TabsTrigger value="general" className="text-xs sm:text-sm whitespace-nowrap"><Settings className="h-4 w-4 mr-1" /><span className="hidden sm:inline">General</span></TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm whitespace-nowrap"><Mail className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Email</span></TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm whitespace-nowrap"><CreditCard className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Payment</span></TabsTrigger>
            <TabsTrigger value="cdn" className="text-xs sm:text-sm whitespace-nowrap"><Globe className="h-4 w-4 mr-1" /><span className="hidden sm:inline">CDN</span></TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm whitespace-nowrap"><Code className="h-4 w-4 mr-1" /><span className="hidden sm:inline">API</span></TabsTrigger>
            <TabsTrigger value="domains" className="text-xs sm:text-sm whitespace-nowrap"><Globe className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Domains</span></TabsTrigger>
            <TabsTrigger value="system" className="text-xs sm:text-sm whitespace-nowrap"><AlertCircle className="h-4 w-4 mr-1" /><span className="hidden sm:inline">System</span></TabsTrigger>
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
	            <TabsContent value="system">
	              <SystemSettings dashboardStats={dashboardStats} loadingStats={loadingStats} />
	            </TabsContent>
	          </div>
	        </Tabs>
	      </CardContent>
	    </Card>
	  );
	};

export default AdminSettings;