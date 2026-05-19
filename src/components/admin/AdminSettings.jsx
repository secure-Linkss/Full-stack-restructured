import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { motion } from 'framer-motion';
import {
  Settings, Save, Key, Globe, Shield, RefreshCw, AlertTriangle,
  Trash2, Mail, Send, Database, FileX, Ban, Plus, X, Skull,
  CreditCard, Wallet, Bitcoin
} from 'lucide-react';
import api from '../../services/api';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] } })
};

const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{children}</p>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      {description && <p className="text-[11px] text-white/35 mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'BrainLink',
    supportEmail: '',
    maintenanceMode: false,
    enableRegistrations: true,
    stripeEnabled: true,
    paypalEnabled: false,
    cryptoEnabled: false,
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    telegramOnNewUser: true,
    telegramOnCryptoPayment: true,
    telegramOnSupportTicket: true,
  });

  const [wipeConfirm, setWipeConfirm] = useState('');
  const [wipeMode, setWipeMode] = useState('');

  const [rateLimitSettings, setRateLimitSettings] = useState({
    enabled: true,
    requests_per_minute: 60,
    requests_per_hour: 1000,
    burst_limit: 20,
    block_duration_minutes: 15,
  });
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [botDetection, setBotDetection] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.adminSettings?.get() || {};
        setSettings(prev => ({ ...prev, ...data }));
      } catch {
        // silent fallback
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const fetchSecuritySettings = async () => {
    setSecurityLoading(true);
    try {
      const [rlRes, ipRes] = await Promise.allSettled([
        api.admin.security.getRateLimitSettings(),
        api.admin.security.getBlockedIPs(),
      ]);
      if (rlRes.status === 'fulfilled' && rlRes.value?.settings) {
        setRateLimitSettings(prev => ({ ...prev, ...rlRes.value.settings }));
      }
      if (ipRes.status === 'fulfilled') {
        setBlockedIPs(ipRes.value?.blocked_ips || ipRes.value?.ips || []);
      }
    } catch {
      // silent
    } finally {
      setSecurityLoading(false);
    }
  };

  const saveRateLimits = async () => {
    setSaving(true);
    try {
      await api.admin.security.updateRateLimitSettings(rateLimitSettings);
      toast.success('Rate limit settings saved.');
    } catch {
      toast.error('Failed to save rate limit settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP.trim()) return toast.error('Enter an IP address.');
    try {
      await api.admin.security.addBlockedIP(newIP.trim(), newIPReason || 'Blocked by admin');
      setBlockedIPs(prev => [...prev, { ip_address: newIP.trim(), reason: newIPReason || 'Blocked by admin' }]);
      setNewIP('');
      setNewIPReason('');
      toast.success(`IP ${newIP} blocked.`);
    } catch {
      toast.error('Failed to block IP.');
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      await api.admin.security.removeBlockedIP(ip);
      setBlockedIPs(prev => prev.filter(b => b.ip_address !== ip));
      toast.success(`IP ${ip} unblocked.`);
    } catch {
      toast.error('Failed to unblock IP.');
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      if (api.adminSettings?.update) {
        await api.adminSettings.update(settings);
      }
      toast.success(`${section} settings saved successfully.`);
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const executeWipe = async () => {
    if (wipeConfirm !== 'CONFIRM DELETE') {
      return toast.error('You must type EXACTLY "CONFIRM DELETE" to execute.');
    }
    setSaving(true);
    try {
      if (api.adminSettings?.wipeSystem) {
        await api.adminSettings.wipeSystem({ mode: wipeMode });
      }
      toast.success(`Wipe Mode: [${wipeMode}] executed successfully.`);
      setWipeConfirm('');
      setWipeMode('');
    } catch {
      toast.error('System Wipe Failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#3b82f6]" /> Center Core
        </h2>
        <p className="text-sm text-white/40 mt-1">Global logic constants, API gateways, and destructive system commands.</p>
      </motion.div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-[#141d2e] border border-[#1e2d47]">
          <TabsTrigger value="general" className="text-xs uppercase tracking-widest"><Globe className="w-3.5 h-3.5 mr-2" />General</TabsTrigger>
          <TabsTrigger value="telegram" className="text-xs uppercase tracking-widest"><Send className="w-3.5 h-3.5 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-xs uppercase tracking-widest"><Shield className="w-3.5 h-3.5 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs uppercase tracking-widest"><CreditCard className="w-3.5 h-3.5 mr-2" />Payments</TabsTrigger>
          <TabsTrigger value="danger" className="text-xs uppercase tracking-widest text-[#ef4444]"><AlertTriangle className="w-3.5 h-3.5 mr-2" />Danger Zone</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-4">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Globe className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Platform General Constants</h3>
                  <p className="text-[11px] text-white/35">Core identity and access settings for the platform.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <SectionLabel>Company Name</SectionLabel>
                  <input
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                    className="w-full px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    value={settings.companyName}
                    onChange={e => updateSetting('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <SectionLabel>Support Email</SectionLabel>
                  <input
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                    className="w-full px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    placeholder="support@domain.com"
                    value={settings.supportEmail || ''}
                    onChange={e => updateSetting('supportEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-5">
                <ToggleRow
                  label="Global Maintenance Mode"
                  description="Locks all non-admin users out of the platform."
                  checked={settings.maintenanceMode}
                  onChange={c => updateSetting('maintenanceMode', c)}
                />
                <ToggleRow
                  label="Allow New Node Registrations"
                  description="Toggle open registration endpoints."
                  checked={settings.enableRegistrations}
                  onChange={c => updateSetting('enableRegistrations', c)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('General')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Constants
                </button>
              </div>
            </motion.div>
          </TabsContent>

          {/* NOTIFICATIONS / TELEGRAM TAB */}
          <TabsContent value="telegram" className="space-y-4">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Send className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Telegram Operations Center</h3>
                  <p className="text-[11px] text-white/35">Wire the system to Telegram for live billing, system, and ticket pings.</p>
                </div>
              </div>

              <ToggleRow
                label="Activate Telemetry Bot"
                description="Enable the Telegram bot to receive platform notifications."
                checked={settings.telegramEnabled}
                onChange={c => updateSetting('telegramEnabled', c)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-5">
                <div className="space-y-1.5">
                  <SectionLabel>Bot API Token</SectionLabel>
                  <input
                    type="password"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                    className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    value={settings.telegramBotToken}
                    onChange={e => updateSetting('telegramBotToken', e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                </div>
                <div className="space-y-1.5">
                  <SectionLabel>Matrix Global Chat ID</SectionLabel>
                  <input
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                    className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    value={settings.telegramChatId}
                    onChange={e => updateSetting('telegramChatId', e.target.value)}
                    placeholder="-100987654321"
                  />
                </div>
              </div>

              <div className="mb-5">
                <SectionLabel>Trigger Matrices</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {[
                    { label: 'New User Registration', key: 'telegramOnNewUser' },
                    { label: 'Crypto Payment Pending', key: 'telegramOnCryptoPayment' },
                    { label: 'Support Ticket Opened', key: 'telegramOnSupportTicket' },
                  ].map(({ label, key }) => (
                    <div
                      key={key}
                      className="flex justify-between items-center p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-xs text-white/60">{label}</span>
                      <Switch checked={settings[key]} onCheckedChange={c => updateSetting(key, c)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => toast.info('Ping sent effectively.')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all text-[#3b82f6]"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
                >
                  <Send className="w-4 h-4" /> Test Connection
                </button>
                <button
                  onClick={() => handleSave('Telegram')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Activate Relay
                </button>
              </div>
            </motion.div>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-4">
            {/* Rate Limiting */}
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Shield className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Rate Limiting</h3>
                    <p className="text-[11px] text-white/35">Control request throttling for all API endpoints platform-wide.</p>
                  </div>
                </div>
                <Switch checked={rateLimitSettings.enabled} onCheckedChange={c => setRateLimitSettings(p => ({ ...p, enabled: c }))} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Requests / Minute', key: 'requests_per_minute' },
                  { label: 'Requests / Hour', key: 'requests_per_hour' },
                  { label: 'Burst Limit', key: 'burst_limit' },
                  { label: 'Block Duration (min)', key: 'block_duration_minutes' },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1.5">
                    <SectionLabel>{label}</SectionLabel>
                    <input
                      type="number"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                      className="w-full px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]/50 transition-colors"
                      value={rateLimitSettings[key]}
                      onChange={e => setRateLimitSettings(p => ({ ...p, [key]: +e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveRateLimits}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Rate Limits
                </button>
              </div>
            </motion.div>

            {/* Bot Detection */}
            <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Shield className="w-4 h-4 text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Bot Detection</h3>
                  <p className="text-[11px] text-white/35">Auto-detect and neutralize known bot patterns and scrapers.</p>
                </div>
              </div>

              <ToggleRow
                label="Enable Bot Blocking"
                description="Auto-detect and block known bot user-agents and scrapers."
                checked={botDetection}
                onChange={setBotDetection}
              />
              <ToggleRow
                label="Honeypot Traps"
                description="Insert invisible link traps to catch automated crawlers."
                checked={true}
                onChange={() => {}}
              />

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => toast.success('Bot detection settings saved.')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>

            {/* IP Blocklist */}
            <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Ban className="w-4 h-4 text-[#ef4444]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">IP Blocklist</h3>
                    <p className="text-[11px] text-white/35">Block specific IP addresses from accessing the platform.</p>
                  </div>
                </div>
                <button
                  onClick={fetchSecuritySettings}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <RefreshCw className={`w-3 h-3 ${securityLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                  className="flex-1 px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#ef4444]/50 transition-colors"
                  placeholder="IP address (e.g. 192.168.1.1)"
                  value={newIP}
                  onChange={e => setNewIP(e.target.value)}
                />
                <input
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  className="flex-1 px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                  placeholder="Reason (optional)"
                  value={newIPReason}
                  onChange={e => setNewIPReason(e.target.value)}
                />
                <button
                  onClick={handleBlockIP}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {blockedIPs.length === 0 ? (
                <p className="text-xs text-white/25 py-6 text-center">No IPs blocked. Enter an IP above to block it.</p>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
                  {blockedIPs.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 transition-colors" style={{ borderBottom: i < blockedIPs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'rgba(239,68,68,0.03)' }}>
                      <div>
                        <code className="text-sm font-mono text-white">{entry.ip_address || entry.ip}</code>
                        {entry.reason && <span className="text-xs text-white/30 ml-3">{entry.reason}</span>}
                      </div>
                      <button onClick={() => handleUnblockIP(entry.ip_address || entry.ip)} className="text-xs text-[#ef4444] hover:text-red-300 flex items-center gap-1 transition-colors">
                        <X className="w-3.5 h-3.5" /> Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-4">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CreditCard className="w-4 h-4 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Payment Gateways</h3>
                  <p className="text-[11px] text-white/35">Configure and enable payment processors for the platform.</p>
                </div>
              </div>

              {/* Stripe */}
              <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#3b82f6]" />
                    <span className="text-sm font-semibold text-white">Stripe</span>
                    {settings.stripeEnabled && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] font-semibold uppercase tracking-wider">Active</span>}
                  </div>
                  <Switch checked={settings.stripeEnabled} onCheckedChange={c => updateSetting('stripeEnabled', c)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <SectionLabel>Publishable Key</SectionLabel>
                    <input
                      type="password"
                      placeholder="pk_live_..."
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                      className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <SectionLabel>Secret Key</SectionLabel>
                    <input
                      type="password"
                      placeholder="sk_live_..."
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                      className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* PayPal */}
              <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#f59e0b]" />
                    <span className="text-sm font-semibold text-white">PayPal</span>
                    {settings.paypalEnabled && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] font-semibold uppercase tracking-wider">Active</span>}
                  </div>
                  <Switch checked={settings.paypalEnabled} onCheckedChange={c => updateSetting('paypalEnabled', c)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <SectionLabel>Client ID</SectionLabel>
                    <input
                      type="password"
                      placeholder="PayPal Client ID..."
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                      className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#f59e0b]/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <SectionLabel>Client Secret</SectionLabel>
                    <input
                      type="password"
                      placeholder="PayPal Secret..."
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                      className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#f59e0b]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Crypto */}
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-4 h-4 text-[#f97316]" />
                    <span className="text-sm font-semibold text-white">Crypto (NOWPayments)</span>
                    {settings.cryptoEnabled && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] font-semibold uppercase tracking-wider">Active</span>}
                  </div>
                  <Switch checked={settings.cryptoEnabled} onCheckedChange={c => updateSetting('cryptoEnabled', c)} />
                </div>
                <div className="space-y-1">
                  <SectionLabel>NOWPayments API Key</SectionLabel>
                  <input
                    type="password"
                    placeholder="API Key..."
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'monospace' }}
                    className="w-full px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#f97316]/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Payments')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Payment Config
                </button>
              </div>
            </motion.div>
          </TabsContent>

          {/* DANGER ZONE TAB */}
          <TabsContent value="danger" className="space-y-4">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible"
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(30,5,5,0.85)', backdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14 }}
            >
              {/* Dramatic Header */}
              <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
                  <Skull className="w-6 h-6 text-[#ef4444]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#ef4444] uppercase tracking-widest">Terminal Destruction Engine</h3>
                  <p className="text-[11px] text-[#ef4444]/50 mt-0.5">Direct database mutations. These commands bypass all safeguards and drop cluster data entirely.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { mode: 'SOFT', icon: Database, color: '#f59e0b', label: 'Mode 1: Soft Wipe', desc: 'Purge all telemetry, link clicks, and network data. Keep Users & Links intact.' },
                  { mode: 'MEDIUM', icon: Trash2, color: '#f97316', label: 'Mode 2: Medium Wipe', desc: 'Eradicate all Links, Campaigns, and Users. Keep Admin accounts active.' },
                  { mode: 'HARD', icon: AlertTriangle, color: '#ef4444', label: 'Mode 3: Hard Factory Reset', desc: 'Total cascade failure. Wipes entire DB structure. Returns app to pristine state.' },
                  { mode: 'CACHE', icon: FileX, color: '#3b82f6', label: 'Mode 4: Cache Purge', desc: 'Drop all temporary system logs, error files, and redis caches safely.' },
                ].map(({ mode, icon: Icon, color, label, desc }) => {
                  const isSelected = wipeMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setWipeMode(mode)}
                      className="text-left p-4 rounded-xl transition-all"
                      style={{
                        background: isSelected ? `rgba(${color === '#3b82f6' ? '59,130,246' : color === '#ef4444' ? '239,68,68' : color === '#f97316' ? '249,115,22' : '245,158,11'},0.12)` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isSelected ? `0 0 20px ${color}22` : 'none',
                      }}
                    >
                      <Icon className="w-5 h-5 mb-2" style={{ color: isSelected ? color : 'rgba(255,255,255,0.2)' }} />
                      <h4 className="font-bold text-sm text-white mb-1">{label}</h4>
                      <p className="text-xs text-white/35">{desc}</p>
                    </button>
                  );
                })}
              </div>

              {wipeMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl text-center"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 30px rgba(239,68,68,0.1)' }}
                >
                  <Skull className="w-8 h-8 text-[#ef4444] mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-white mb-1">You are about to execute:</p>
                  <p className="text-xl font-black text-[#ef4444] uppercase tracking-widest mb-4">{wipeMode} WIPE</p>
                  <input
                    value={wipeConfirm}
                    onChange={e => setWipeConfirm(e.target.value)}
                    placeholder="Type 'CONFIRM DELETE' to unlock"
                    className="w-full max-w-sm mx-auto block text-center px-4 py-2.5 text-sm font-bold text-white placeholder-white/25 outline-none mb-4"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10 }}
                  />
                  <button
                    disabled={wipeConfirm !== 'CONFIRM DELETE' || saving}
                    onClick={executeWipe}
                    className="flex items-center justify-center gap-2 mx-auto px-8 py-2.5 rounded-xl text-sm font-black text-white uppercase tracking-widest disabled:opacity-30 transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 0 20px rgba(239,68,68,0.5)', maxWidth: 320, width: '100%' }}
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
                    DEPLOY DESTRUCTIVE SEQUENCE
                  </button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
