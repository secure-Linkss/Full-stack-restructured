import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Palette, Upload, CheckCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';

const STORAGE_KEY = 'brain_appearance';

const applyBackground = (color, url) => {
  if (url) {
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundColor = '';
  } else if (color && color !== '#000000') {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = color;
  } else {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '';
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') root.classList.add('theme-light');
  else root.classList.add('theme-dark');
};

const AppearanceSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { theme: 'dark', background_url: '', background_color: '#000000' };
  });
  const [preview, setPreview] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.userSettings.getAppearance();
      const loaded = {
        theme: response.theme || 'dark',
        background_url: response.background_url || '',
        background_color: response.background_color || '#000000',
      };
      setSettings(loaded);
      setPreview(loaded);
    } catch {
      // Fallback to localStorage already set in initial state
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setPreview(prev => ({ ...prev, theme: newTheme }));
    applyTheme(newTheme);
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setPreview(prev => ({ ...prev, background_color: color, background_url: '' }));
    applyBackground(color, '');
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('background_image', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/user/settings/background`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      const url = data.url || data.background_url || '';
      setPreview(prev => ({ ...prev, background_url: url, background_color: '#000000' }));
      applyBackground('#000000', url);
      toast.success('Background image uploaded!');
    } catch {
      toast.error('Failed to upload background image.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.userSettings.updateAppearance(preview);
      setSettings(preview);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preview));
      applyTheme(preview.theme);
      applyBackground(preview.background_color, preview.background_url);
      toast.success('Appearance settings saved!');
    } catch {
      toast.error('Failed to save appearance settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreview(settings);
    applyTheme(settings.theme);
    applyBackground(settings.background_color, settings.background_url);
  };

  const isDirty = JSON.stringify(preview) !== JSON.stringify(settings);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance</CardTitle>
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
        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance</CardTitle>
        <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard.</p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Theme Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="flex gap-3">
            {[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  preview.theme === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Changes preview instantly.</p>
        </div>

        {/* Background Color */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-medium">Background Color</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={preview.background_color || '#000000'}
                onChange={handleColorChange}
                className="h-10 w-10 rounded-lg cursor-pointer border border-border"
                disabled={saving}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground font-mono">{preview.background_color}</span>
              <span className="text-xs text-muted-foreground">Click the swatch to pick a color</span>
            </div>
            {/* Live preview swatch */}
            <div
              className="h-10 w-24 rounded-lg border border-border flex items-center justify-center text-xs text-white/70 shrink-0"
              style={{ backgroundColor: preview.background_color || '#000000' }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />Preview
            </div>
          </div>
        </div>

        {/* Background Image Upload */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-medium">Background Image</Label>
          <p className="text-xs text-muted-foreground">Upload an image to use as your dashboard background. Overrides solid color.</p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer btn-primary px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity">
              <Upload className="h-4 w-4" />
              <span>Choose Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
                disabled={saving}
              />
            </label>
            {preview.background_url && (
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <CheckCircle className="h-4 w-4" />
                <span>Image set</span>
                <button
                  onClick={() => { setPreview(p => ({ ...p, background_url: '' })); applyBackground(preview.background_color, ''); }}
                  className="text-muted-foreground hover:text-destructive underline ml-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Image preview */}
          {preview.background_url && (
            <div
              className="h-24 w-full rounded-lg border border-border bg-cover bg-center"
              style={{ backgroundImage: `url(${preview.background_url})` }}
            />
          )}
        </div>

        {/* Save / Reset */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="btn-primary px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Appearance'}
          </button>
          {isDirty && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              Discard Changes
            </Button>
          )}
          {!isDirty && !saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
