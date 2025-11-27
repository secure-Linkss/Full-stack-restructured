import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Mail, CreditCard, Globe, Code, AlertTriangle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Import the new modular components
import GeneralSettingsTab from './GeneralSettingsTab';
import EmailSettingsTab from './EmailSettingsTab';
import PaymentSettingsTab from './PaymentSettingsTab';
import CDNStorageSettingsTab from './CDNStorageSettingsTab';
import APISettingsTab from './APISettingsTab';
import DomainManagementTab from './DomainManagementTab'; // New feature

// Use the new API service
import api from '@/services/api';

const AdminSettings = () => {
  // Use the new state management structure
  const [settings, setSettingsState] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial settings structure from the old file, extended with new keys
  const initialSettings = {
    // General
    companyName: 'Brain Link Tracker Pro',
    companyLogoUrl: 'https://example.com/logo.png',
    maintenanceMode: false,
    enableRegistrations: true,
    // Email
    smtpEnabled: false,
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPassword: 'password123',
    // Payment (Old)
    stripeEnabled: false,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: 'sk_test_...',
    paypalEnabled: false,
    paypalClientId: 'AZY...',
    paypalSecret: 'EGH...',
    // CDN/Storage
    s3Enabled: false,
    s3BucketName: 'brainlink-assets',
    s3Region: 'us-east-1',
    s3AccessKeyId: 'AKIA...',
    s3SecretAccessKey: 'wJalr...',
    // API
    telegramEnabled: false,
    telegramBotToken: '123456:ABC-DEF...',
    telegramChatId: '-100123456789',
    // New features (keys are assumed to be handled by the new components)
    // The main component only needs to ensure the fetch/update logic is sound.
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Adopt the new API-based fetch logic
  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Assuming the new API call is correct and returns all settings
      const response = await api.adminSettings.getAll();
      if (response.success) {
        // Merge fetched settings with initial defaults to ensure all keys exist
        setSettingsState({ ...initialSettings, ...response.settings });
      } else {
        // Fallback to initial settings on API failure
        setSettingsState(initialSettings);
        toast.error('Failed to load settings from API. Using defaults.');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettingsState(initialSettings);
      toast.error('Failed to load settings from API. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  // Centralized setting update function to pass to modular components
  const updateSetting = (key, value) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  // Centralized save function using the new API call
  const handleSave = async () => {
    setSaving(true);
    try {
      // Assuming the new API call is correct for updating all settings
      const response = await api.adminSettings.update(settings);
      if (response.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Platform Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          {/* Adopt the new clean navigation banner/TabsList structure */}
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="cdn">CDN/Storage</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            {/* General Settings Tab */}
            <TabsContent value="general">
              <GeneralSettingsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                handleSave={handleSave}
              />
            </TabsContent>

            {/* Email Settings Tab */}
            <TabsContent value="email">
              <EmailSettingsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                handleSave={handleSave}
              />
            </TabsContent>

            {/* Payment Settings Tab (Merged old Stripe/PayPal with new Crypto) */}
            <TabsContent value="payment">
              <PaymentSettingsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                handleSave={handleSave}
              />
            </TabsContent>

            {/* CDN/Storage Settings Tab */}
            <TabsContent value="cdn">
              <CDNStorageSettingsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                handleSave={handleSave}
              />
            </TabsContent>

            {/* API Settings Tab */}
            <TabsContent value="api">
              <APISettingsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                handleSave={handleSave}
              />
            </TabsContent>

            {/* Domain Management Tab (New Feature) */}
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
