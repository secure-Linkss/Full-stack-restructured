import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Mail, CreditCard, Globe, Code, AlertTriangle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DomainManagementTab from './DomainManagementTab';
import CryptoWalletManager from './CryptoWalletManager';
import BlockchainVerificationSettings from './BlockchainVerificationSettings';
import api from '@/services/api';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [settings, setSettingsState] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.adminSettings.getAll();
      if (response.success) {
        setSettingsState(response.settings || {});
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="general">
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Platform Identity</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" value={settings.companyName || ''} onChange={(e) => updateSetting('companyName', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="payment">
              <div className="space-y-6">
                <CryptoWalletManager />
                <BlockchainVerificationSettings />
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Payment Settings
                  </Button>
                </div>
              </div>
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