import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Lock, CreditCard, Bell, Code,
  Trash2, Palette, TestTube, CheckCircle, XCircle, Globe, ChevronRight
} from 'lucide-react';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import UserApiKeyManager from './UserApiKeyManager';
import AccountSettings from './AccountSettings';
import SecuritySettings from './SecuritySettings';
import AppearanceSettings from './AppearanceSettings';
import BillingAndSubscription from './BillingAndSubscription';
import UserDomains from './UserDomains';
import api from '../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="relative w-9 h-9">
    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
  </div>
);

// ─── Notification Settings ────────────────────────────────────────────────────
const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    telegram_enabled: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    notification_types: {
      campaign_alerts: true,
      link_clicks: false,
      security_threats: true,
      bot_detections: true,
      captured_data: true,
    },
    notification_frequency: 'realtime',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      setSettings({
        telegram_enabled: response.telegram_enabled || false,
        telegram_bot_token: response.telegram_bot_token || '',
        telegram_chat_id: response.telegram_chat_id || '',
        notification_types: response.notification_types || {
          campaign_alerts: true, link_clicks: false,
          security_threats: true, bot_detections: true, captured_data: true,
        },
        notification_frequency: response.notification_frequency || 'realtime',
      });
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.update(settings);
      toast.success('Notification settings saved successfully!');
    } catch (error) {
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      toast.info('Sending test notification...');
      await api.account.testTelegram(settings.telegram_bot_token, settings.telegram_chat_id);
      setTestStatus('success');
      toast.success('Test notification sent! Check your Telegram.');
    } catch (error) {
      setTestStatus('error');
      toast.error('Failed to send test notification.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  const notifTypes = [
    { key: 'campaign_alerts', label: 'Campaign Performance Alerts', desc: 'Get notified about campaign milestones' },
    { key: 'link_clicks', label: 'Link Click Notifications', desc: 'Real-time alerts for every link click' },
    { key: 'security_threats', label: 'Security Threat Alerts', desc: 'Warnings about suspicious activity' },
    { key: 'bot_detections', label: 'Bot Detection Alerts', desc: 'Notifications when bots are blocked' },
    { key: 'captured_data', label: 'Captured Data Notifications', desc: 'Alerts when emails are captured' },
  ];

  return (
    <div className="space-y-5">
      {/* Telegram Integration */}
      <motion.div
        style={glassCard}
        className="p-6"
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Bell className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Telegram Notifications</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Configure Telegram bot for real-time alerts</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Enable Telegram</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Receive alerts via your Telegram bot</p>
            </div>
            <Switch
              checked={settings.telegram_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, telegram_enabled: checked })}
            />
          </div>

          <AnimatePresence>
            {settings.telegram_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Bot Token
                  </label>
                  <input
                    type="password"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    className="enterprise-input w-full text-sm"
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Get your bot token from @BotFather on Telegram</p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Chat ID
                  </label>
                  <input
                    placeholder="-100123456789 or 123456789"
                    value={settings.telegram_chat_id}
                    onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    className="enterprise-input w-full text-sm"
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Your personal chat ID or group chat ID</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestNotification}
                    disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
                    className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  >
                    <TestTube className="w-4 h-4" />
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {testStatus === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Notification Types */}
      <AnimatePresence>
        {settings.telegram_enabled && (
          <motion.div
            style={glassCard}
            className="p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Notification Types
            </p>
            <div className="space-y-4">
              {notifTypes.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings.notification_types[item.key]}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notification_types: { ...settings.notification_types, [item.key]: checked },
                    })}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={cardVariants} custom={1} initial="hidden" animate="visible">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>
    </div>
  );
};

// ─── API Settings ─────────────────────────────────────────────────────────────
const ApiSettings = () => (
  <motion.div
    style={glassCard}
    className="p-6"
    variants={cardVariants}
    custom={0}
    initial="hidden"
    animate="visible"
  >
    <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
        <Code className="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">API Management</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Manage your personal API keys for programmatic access</p>
      </div>
    </div>
    <UserApiKeyManager />
  </motion.div>
);

// ─── Danger Zone ──────────────────────────────────────────────────────────────
const DangerZone = () => {
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you ABSOLUTELY sure? This will permanently delete your account and ALL data. This action cannot be undone.');
    if (!confirmed) return;
    const secondConfirm = window.prompt('Type "DELETE" to confirm account deletion:');
    if (secondConfirm !== 'DELETE') return toast.error('Deletion cancelled.');
    try {
      await api.account.deleteAccount();
      toast.success('Account deletion initiated. You will be logged out.');
      setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 2000);
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
    }
  };

  return (
    <motion.div
      style={{ ...glassCard, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}
      className="p-6"
      variants={cardVariants}
      custom={0}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-400">Danger Zone</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Irreversible actions that will affect your account</p>
        </div>
      </div>

      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl"
        style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
      >
        <div>
          <p className="text-sm font-semibold text-white">Delete Account</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Permanently delete your account and all associated data.</p>
        </div>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-red-400 transition-all shrink-0"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          Delete Account
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main Settings Component ──────────────────────────────────────────────────
const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const settingsTabs = [
    { id: 'account',       label: 'Account',       icon: User,         component: AccountSettings,      color: '#3b82f6' },
    { id: 'domains',       label: 'Custom Domains', icon: Globe,        component: UserDomains,          color: '#10b981' },
    { id: 'appearance',    label: 'Appearance',     icon: Palette,      component: AppearanceSettings,   color: '#8b5cf6' },
    { id: 'security',      label: 'Security',       icon: Lock,         component: SecuritySettings,     color: '#f59e0b' },
    { id: 'billing',       label: 'Billing',        icon: CreditCard,   component: BillingAndSubscription, color: '#10b981' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,         component: NotificationSettings, color: '#3b82f6' },
    { id: 'api',           label: 'API Access',     icon: Code,         component: ApiSettings,          color: '#8b5cf6' },
    { id: 'danger',        label: 'Danger Zone',    icon: Trash2,       component: DangerZone,           color: '#ef4444' },
  ];

  const activeTabData = settingsTabs.find(t => t.id === activeTab) || settingsTabs[0];
  const ActiveComponent = activeTabData.component;

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <SettingsIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Manage your account, security, billing, and preferences</p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <motion.div
          style={{ ...glassCard, width: '100%', maxWidth: '240px', flexShrink: 0 }}
          className="p-3 self-start lg:sticky lg:top-6"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-1 pb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Navigation
          </p>
          <nav className="space-y-0.5">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
                  style={{
                    background: isActive ? `rgba(${tab.color === '#3b82f6' ? '59,130,246' : tab.color === '#10b981' ? '16,185,129' : tab.color === '#8b5cf6' ? '139,92,246' : tab.color === '#f59e0b' ? '245,158,11' : tab.color === '#ef4444' ? '239,68,68' : '59,130,246'},0.12)` : 'transparent',
                    border: isActive ? `1px solid rgba(${tab.color === '#3b82f6' ? '59,130,246' : tab.color === '#10b981' ? '16,185,129' : tab.color === '#8b5cf6' ? '139,92,246' : tab.color === '#f59e0b' ? '245,158,11' : tab.color === '#ef4444' ? '239,68,68' : '59,130,246'},0.2)` : '1px solid transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? tab.color : 'rgba(255,255,255,0.35)' }}
                    />
                    {tab.label}
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </motion.button>
              );
            })}
          </nav>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5 mb-5">
                <activeTabData.icon
                  className="w-5 h-5"
                  style={{ color: activeTabData.color }}
                />
                <h2 className="text-lg font-bold text-white">{activeTabData.label}</h2>
              </div>

              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
