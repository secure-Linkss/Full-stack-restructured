import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Palette, Upload, CheckCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';
import { themes } from '../hooks/useTheme';

const STORAGE_KEY = 'brain_appearance';

/**
 * Apply a theme by setting CSS custom properties on :root.
 * Replaces the old class-only approach (theme-light had no CSS definitions).
 * Supports: dark, light, purple, emerald, system (auto-detects OS preference).
 */
const applyTheme = (theme) => {
  const root = document.documentElement;

  // Remove all theme classes
  Object.values(themes).forEach(t => root.classList.remove(t.class));

  // Resolve "system" to actual preference
  let resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const themeConfig = themes[resolved] || themes.dark;
  root.classList.add(themeConfig.class);

  // Set every CSS custom property so components pick up the new palette
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Persist choice
  localStorage.setItem('brain-link-tracker-theme', theme);
};

const applyBackground = (color, url) => {
  if (url) {
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundColor = '';
  } else if (color) {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = color;
  } else {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '';
  }
};

const THEME_OPTIONS = [
  { value: 'dark',    label: 'Dark',    swatch: '#0f172a' },
  { value: 'light',   label: 'Light',   swatch: '#ffffff' },
  { value: 'purple',  label: 'Purple',  swatch: '#1a0b2e' },
  { value: 'emerald', label: 'Emerald', swatch: '#064e3b' },
  { value: 'system',  label: 'System',  swatch: null },
];

const AppearanceSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { theme: 'dark', background_url: '', background_color: '' };
  });
  const [preview, setPreview] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Re-apply visual state whenever preview changes (instant preview)
  useEffect(() => {
    applyTheme(preview.theme);
    applyBackground(preview.background_color, preview.background_url);
  }, [preview.theme]);

  const fetchSettings = async () => {
    try {
      const response = await api.userSettings.getAppearance();
      const loaded = {
        theme: response.theme || 'dark',
        background_url: response.background_url || '',
        background_color: response.background_color || '',
      };
      setSettings(loaded);
      setPreview(loaded);
      applyTheme(loaded.theme);
      applyBackground(loaded.background_color, loaded.background_url);
    } catch {
      // Fallback: apply whatever is in localStorage
      applyTheme(settings.theme);
      applyBackground(settings.background_color, settings.background_url);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setPreview(prev => ({ ...prev, theme: newTheme }));
    // applyTheme is called by the useEffect above
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
      setPreview(prev => ({ ...prev, background_url: url, background_color: '' }));
      applyBackground('', url);
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
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map(({ value, label, swatch }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  preview.theme === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent/20'
                }`}
              >
                {swatch && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: swatch }}
                  />
                )}
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Changes preview instantly. Click Save to persist.</p>
        </div>

        {/* Background Color */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-medium">Background Color</Label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={preview.background_color || '#0b0f1a'}
              onChange={handleColorChange}
              className="h-10 w-10 rounded-lg cursor-pointer border border-border"
              disabled={saving}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground font-mono">{preview.background_color || 'Default'}</span>
              <span className="text-xs text-muted-foreground">Click the swatch to pick a color</span>
            </div>
            {/* Live preview swatch */}
            <div
              className="h-10 w-24 rounded-lg border border-border flex items-center justify-center text-xs shrink-0"
              style={{ backgroundColor: preview.background_color || '#0b0f1a', color: '#ffffffaa' }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />Preview
            </div>
            {preview.background_color && (
              <button
                onClick={() => { setPreview(p => ({ ...p, background_color: '' })); applyBackground('', preview.background_url); }}
                className="text-xs text-muted-foreground hover:text-destructive underline"
              >
                Reset
              </button>
            )}
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
