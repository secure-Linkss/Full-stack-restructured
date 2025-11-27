import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Palette, Upload, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';

const AppearanceSettings = () => {
  const [settings, setSettings] = useState({
    theme: 'system',
    background_url: '',
    background_color: '#000000',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      setSettings({
        theme: response.theme || 'system',
        background_url: response.background_url || '',
        background_color: response.background_color || '#000000',
      });
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
      // Fallback to default if API fails
      setSettings({ theme: 'system', background_url: '', background_color: '#000000' });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handleColorChange = (e) => {
    setSettings(prev => ({ ...prev, background_color: e.target.value, background_url: '' }));
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('background_image', file);

    try {
      // Upload background image using profile avatar upload (can be extended for backgrounds)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/user/settings/background`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setSettings(prev => ({ ...prev, background_url: data.url || data.background_url, background_color: '' }));
      toast.success('Background image uploaded successfully!');
    } catch (error) {
      console.error('Background upload failed:', error);
      toast.error('Failed to upload background image.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.update(settings);
      // Apply theme immediately
      document.documentElement.className = settings.theme === 'dark' ? 'theme-dark' : settings.theme === 'light' ? 'theme-light' : 'theme-dark';
      toast.success('Appearance settings saved!');
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
      toast.error('Failed to save appearance settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="h-5 w-5 mr-2 text-primary" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Loading appearance settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Palette className="h-5 w-5 mr-2 text-primary" /> Appearance</CardTitle>
        <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard, including advanced background settings.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex space-x-4">
            {['light', 'dark', 'system'].map(t => (
              <Button
                key={t}
                variant={settings.theme === t ? 'default' : 'outline'}
                onClick={() => handleThemeChange(t)}
                disabled={saving}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Select a theme for the dashboard.</p>
        </div>

        {/* Advanced Background */}
        <div className="space-y-4 pt-4 border-t">
          <Label>Advanced Background</Label>
          <p className="text-sm text-muted-foreground">Set a custom background image or a solid color.</p>

          {/* Color Picker */}
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={settings.background_color}
              onChange={handleColorChange}
              className="h-10 w-10 rounded-lg border-none p-0"
            />
            <Label>Solid Color</Label>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="background-upload">Custom Image Upload</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="background-upload"
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="flex-1"
                disabled={saving}
              />
              {settings.background_url && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            {settings.background_url && (
              <p className="text-xs text-muted-foreground truncate">
                Current Image: <a href={settings.background_url} target="_blank" rel="noopener noreferrer" className="text-blue-400">{settings.background_url}</a>
              </p>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-4">
          {saving ? 'Saving...' : 'Save Appearance Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
