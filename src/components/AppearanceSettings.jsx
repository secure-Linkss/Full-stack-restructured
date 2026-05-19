import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, CheckCircle, Eye, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { themes } from '../hooks/useTheme';

const STORAGE_KEY = 'brain_appearance';

const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

/**
 * Apply a theme by setting CSS custom properties on :root.
 * Supports: dark, light, purple, emerald, system (auto-detects OS preference).
 */
const applyTheme = (theme) => {
  const root = document.documentElement;

  Object.values(themes).forEach(t => root.classList.remove(t.class));

  let resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const themeConfig = themes[resolved] || themes.dark;
  root.classList.add(themeConfig.class);

  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

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
  { value: 'light',   label: 'Light',   swatch: '#f1f5f9' },
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

  // Re-apply visual state whenever preview theme changes (instant preview)
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
      applyTheme(settings.theme);
      applyBackground(settings.background_color, settings.background_url);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setPreview(prev => ({ ...prev, theme: newTheme }));
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
      <motion.div
        style={glassCard}
        className="p-6"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={cardVariants}
      >
        <div className="h-32 flex items-center justify-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">
            Loading appearance settings...
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Theme Section */}
      <motion.div
        style={glassCard}
        className="p-6"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={cardVariants}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 mb-5 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <Palette className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Theme</h3>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Changes preview instantly. Click Save to persist.
            </p>
          </div>
        </div>

        {/* Theme Swatch Grid */}
        <div className="flex flex-wrap gap-4">
          {THEME_OPTIONS.map(({ value, label, swatch }) => {
            const isActive = preview.theme === value;
            return (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                disabled={saving}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    backgroundColor: swatch || 'transparent',
                    border: swatch ? '1px solid rgba(255,255,255,0.1)' : '1px dashed rgba(255,255,255,0.2)',
                    boxShadow: isActive ? '0 0 0 2px #3b82f6' : 'none',
                  }}
                >
                  {!swatch && (
                    <Monitor className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest transition-colors"
                  style={{ color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Background Section */}
      <motion.div
        style={{ ...glassCard, border: '1px solid rgba(16,185,129,0.15)' }}
        className="p-6"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={cardVariants}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 mb-5 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Background</h3>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Set a solid color or upload a custom image.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Color Picker Row */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-semibold uppercase tracking-widest block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Background Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={preview.background_color || '#0b0f1a'}
                onChange={handleColorChange}
                disabled={saving}
                className="h-9 w-9 rounded-lg cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}
              />
              <span
                className="text-sm font-mono"
                style={{ color: preview.background_color ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}
              >
                {preview.background_color || 'Default'}
              </span>

              {/* Preview strip */}
              {preview.background_color && (
                <div
                  className="h-8 w-20 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: preview.background_color,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Eye className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
              )}

              {preview.background_color && (
                <button
                  onClick={() => {
                    setPreview(p => ({ ...p, background_color: '' }));
                    applyBackground('', preview.background_url);
                  }}
                  className="text-[11px] underline transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Image Upload Row */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-semibold uppercase tracking-widest block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Background Image
            </label>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Overrides solid color. Upload an image to use as your dashboard background.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <label
                className="btn-primary flex items-center gap-2 cursor-pointer px-3 py-2 text-sm"
                style={{ borderRadius: 8 }}
              >
                <Upload className="w-3.5 h-3.5" />
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
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Image set</span>
                  <button
                    onClick={() => {
                      setPreview(p => ({ ...p, background_url: '' }));
                      applyBackground(preview.background_color, '');
                    }}
                    className="underline ml-1 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Image thumbnail preview strip */}
            {preview.background_url && (
              <div
                className="h-20 w-full rounded-xl mt-3 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${preview.background_url})`,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Save / Discard Row */}
      <motion.div
        className="flex items-center gap-3"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={cardVariants}
      >
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
              </div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Appearance</span>
          )}
        </button>

        {isDirty && (
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Discard Changes
          </button>
        )}

        {!isDirty && !saving && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Saved
          </span>
        )}
      </motion.div>
    </div>
  );
};

export default AppearanceSettings;
