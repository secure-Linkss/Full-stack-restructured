import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Server, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const RateLimiting = () => {
  const [settings, setSettings] = useState({
    limit: 100,
    window: 60, // seconds
    enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for fetching rate limiting settings
      const data = await api.admin.security.getRateLimitSettings();
      setSettings(data);
      toast.success('Rate limiting settings loaded.');
    } catch (error) {
      console.error('Fetch rate limit settings error:', error);
      toast.error('Failed to load rate limiting settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Assuming a new API endpoint for updating rate limiting settings
      await api.admin.security.updateRateLimitSettings(settings);
      toast.success('Rate limiting settings saved successfully.');
    } catch (error) {
      console.error('Save rate limit settings error:', error);
      toast.error('Failed to save rate limiting settings.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <Card className="bg-yellow-500/10 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center">Rate Limiting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="limit">Max Requests (Limit)</Label>
            <Input
              id="limit"
              type="number"
              value={settings.limit}
              onChange={(e) => setSettings({ ...settings, limit: parseInt(e.target.value) })}
              disabled={loading || saving}
            />
          </div>
          <div>
            <Label htmlFor="window">Time Window (Seconds)</Label>
            <Input
              id="window"
              type="number"
              value={settings.window}
              onChange={(e) => setSettings({ ...settings, window: parseInt(e.target.value) })}
              disabled={loading || saving}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Rate Limiting Enabled</Label>
          <input
            id="enabled"
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            disabled={loading || saving}
            className="h-5 w-5 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSettings}
            disabled={loading || saving}
            className="text-yellow-400 border-yellow-400 hover:bg-yellow-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RateLimiting;
