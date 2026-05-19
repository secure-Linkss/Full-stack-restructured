import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Server, RefreshCw, Gauge, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const RateLimiting = () => {
  const [settings, setSettings] = useState({ limit: 100, window: 60, enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.security.getRateLimitSettings();
      setSettings(data);
    } catch {
      toast.error('Failed to load rate limiting settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.security.updateRateLimitSettings(settings);
      toast.success('Rate limiting settings saved.');
    } catch {
      toast.error('Failed to save rate limiting settings.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const fields = [
    { key: 'limit', label: 'Max Requests', icon: Gauge, suffix: 'req', color: '#f59e0b', desc: 'Max requests per window' },
    { key: 'window', label: 'Time Window', icon: Clock, suffix: 's', color: '#3b82f6', desc: 'Window duration in seconds' },
  ];

  return (
    <div
      className="rounded-[14px] p-5"
      style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}
    >
      <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Server className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-400">Rate Limiting</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Control request throttling per IP</p>
        </div>
        <button
          onClick={() => settings.enabled
            ? setSettings(s => ({ ...s, enabled: false }))
            : setSettings(s => ({ ...s, enabled: true }))
          }
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
          style={settings.enabled
            ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
          }
        >
          {settings.enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {settings.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <field.icon className="w-3 h-3" style={{ color: field.color }} />
              {field.label}
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings[field.key]}
                onChange={(e) => setSettings(s => ({ ...s, [field.key]: parseInt(e.target.value) || 0 }))}
                disabled={loading || saving}
                className="w-full px-3 py-2 pr-8 rounded-lg text-sm text-white bg-transparent outline-none disabled:opacity-50"
                style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(245,158,11,0.2)` }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {field.suffix}
              </span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{field.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={fetchSettings}
          disabled={loading || saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default RateLimiting;
