import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader } from 'lucide-react';
import { toast } from 'sonner';

const EmailSettingsTab = ({ settings, updateSetting, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="smtpEnabled">Enable SMTP</Label>
          <Switch
            id="smtpEnabled"
            checked={settings.smtpEnabled || false}
            onCheckedChange={(checked) => updateSetting('smtpEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input id="smtpHost" value={settings.smtpHost || ''} onChange={(e) => updateSetting('smtpHost', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input id="smtpPort" type="number" value={settings.smtpPort || 587} onChange={(e) => updateSetting('smtpPort', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpUser">SMTP Username</Label>
          <Input id="smtpUser" value={settings.smtpUser || ''} onChange={(e) => updateSetting('smtpUser', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="smtpPassword">SMTP Password</Label>
          <Input id="smtpPassword" type="password" value={settings.smtpPassword || ''} onChange={(e) => updateSetting('smtpPassword', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end space-x-3">
      <Button variant="outline" onClick={() => toast.info('Test email sent (Mock)')}>Test SMTP</Button>
      <Button onClick={() => handleSave()} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Email Settings
      </Button>
    </div>
  </div>
);

export default EmailSettingsTab;
