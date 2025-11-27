import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader } from 'lucide-react';

const CDNStorageSettingsTab = ({ settings, updateSetting, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>AWS S3 Storage</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="s3Enabled">Enable S3 Storage</Label>
          <Switch
            id="s3Enabled"
            checked={settings.s3Enabled || false}
            onCheckedChange={(checked) => updateSetting('s3Enabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="s3BucketName">S3 Bucket Name</Label>
          <Input id="s3BucketName" value={settings.s3BucketName || ''} onChange={(e) => updateSetting('s3BucketName', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="s3Region">S3 Region</Label>
          <Input id="s3Region" value={settings.s3Region || ''} onChange={(e) => updateSetting('s3Region', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="s3AccessKeyId">S3 Access Key ID</Label>
          <Input id="s3AccessKeyId" type="password" value={settings.s3AccessKeyId || ''} onChange={(e) => updateSetting('s3AccessKeyId', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="s3SecretAccessKey">S3 Secret Access Key</Label>
          <Input id="s3SecretAccessKey" type="password" value={settings.s3SecretAccessKey || ''} onChange={(e) => updateSetting('s3SecretAccessKey', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end">
      <Button onClick={() => handleSave()} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save CDN/Storage Settings
      </Button>
    </div>
  </div>
);

export default CDNStorageSettingsTab;
