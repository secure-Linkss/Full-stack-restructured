import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader } from 'lucide-react';
import CryptoWalletManager from './CryptoWalletManager';
import BlockchainVerificationSettings from './BlockchainVerificationSettings';

const PaymentSettingsTab = ({ settings, updateSetting, saving, handleSave }) => (
  <div className="space-y-6">
    {/* Original Stripe Gateway */}
    <Card>
      <CardHeader><CardTitle>Stripe Gateway</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="stripeEnabled">Enable Stripe</Label>
          <Switch
            id="stripeEnabled"
            checked={settings.stripeEnabled || false}
            onCheckedChange={(checked) => updateSetting('stripeEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
          <Input id="stripePublishableKey" type="password" value={settings.stripePublishableKey || ''} onChange={(e) => updateSetting('stripePublishableKey', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
          <Input id="stripeSecretKey" type="password" value={settings.stripeSecretKey || ''} onChange={(e) => updateSetting('stripeSecretKey', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    {/* Original PayPal Gateway */}
    <Card>
      <CardHeader><CardTitle>PayPal Gateway</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="paypalEnabled">Enable PayPal</Label>
          <Switch
            id="paypalEnabled"
            checked={settings.paypalEnabled || false}
            onCheckedChange={(checked) => updateSetting('paypalEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="paypalClientId">PayPal Client ID</Label>
          <Input id="paypalClientId" type="password" value={settings.paypalClientId || ''} onChange={(e) => updateSetting('paypalClientId', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="paypalSecret">PayPal Secret</Label>
          <Input id="paypalSecret" type="password" value={settings.paypalSecret || ''} onChange={(e) => updateSetting('paypalSecret', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    {/* New Crypto Components */}
    <CryptoWalletManager />
    <BlockchainVerificationSettings />

    <div className="flex justify-end">
      <Button onClick={() => handleSave()} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  </div>
);

export default PaymentSettingsTab;
