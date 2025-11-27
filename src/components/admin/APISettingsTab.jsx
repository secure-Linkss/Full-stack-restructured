import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader } from 'lucide-react';
import { toast } from 'sonner';

const APISettingsTab = ({ settings, updateSetting, saving, handleSave }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Telegram Integration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="telegramEnabled">Enable Telegram Notifications</Label>
          <Switch
            id="telegramEnabled"
            checked={settings.telegramEnabled || false}
            onCheckedChange={(checked) => updateSetting('telegramEnabled', checked)}
          />
        </div>
        <div>
          <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
          <Input id="telegramBotToken" type="password" value={settings.telegramBotToken || ''} onChange={(e) => updateSetting('telegramBotToken', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="telegramChatId">Default Chat ID</Label>
          <Input id="telegramChatId" value={settings.telegramChatId || ''} onChange={(e) => updateSetting('telegramChatId', e.target.value)} />
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-end space-x-3">
      <Button variant="outline" onClick={() => toast.info('Test Telegram message sent (Mock)')}>Test Telegram</Button>
      <Button onClick={() => handleSave()} disabled={saving}>
        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save API Settings
      </Button>
    </div>
  </div>
);

export default APISettingsTab;
