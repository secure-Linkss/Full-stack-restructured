import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings as SettingsIcon, User, Lock, CreditCard, Bell, Code, Trash2 } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { Button } from './ui/button';
import { toast } from 'sonner';

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

const NotificationSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center"><Bell className="h-5 w-5 mr-2 text-primary" /> Notifications</CardTitle>
      <p className="text-sm text-muted-foreground">Configure how you receive alerts and updates.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Placeholder Form */}
      <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
        [Notification Preferences Checkboxes]
      </div>
      <Button onClick={() => toast.info('Notification settings saved (Mock)')}>Save Changes</Button>
    </CardContent>
  </Card>
);

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

// --- Main Settings Component ---

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const settingsTabs = [
    { id: 'account', title: 'Account', icon: User, component: AccountSettings },
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
