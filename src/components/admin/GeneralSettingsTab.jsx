import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader } from 'lucide-react';

const GeneralSettingsTab = ({ settings, updateSetting, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Platform Identity</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" value={settings.companyName || ''} onChange={(e) => updateSetting('companyName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
          <Input id="companyLogoUrl" value={settings.companyLogoUrl || ''} onChange={(e) => updateSetting('companyLogoUrl', e.target.value)} />
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
            onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="enableRegistrations">Enable New Registrations</Label>
          <Switch
            id="enableRegistrations"
            checked={settings.enableRegistrations || false}
            onCheckedChange={(checked) => updateSetting('enableRegistrations', checked)}
          />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end">
      <Button onClick={() => handleSave()} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save General Settings
      </Button>
    </div>
  </div>
);

export default GeneralSettingsTab;
