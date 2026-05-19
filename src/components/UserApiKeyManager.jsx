import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle,
  CheckCircle, Clock, Activity, Shield, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

// ── Design tokens ──────────────────────────────────────────────
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

// ── Stat micro-card ────────────────────────────────────────────
const StatMicroCard = ({ label, value, icon: Icon, color, glow, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    style={{ ...glassCard, boxShadow: `0 0 30px ${glow}` }}
    className="p-5 flex items-start justify-between"
  >
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <p className="text-3xl font-heading text-white mt-1 tabular-nums">{value}</p>
    </div>
    <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────
const UserApiKeyManager = () => {
  const [apiKeys, setApiKeys]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [creating, setCreating]             = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKey, setShowKey]               = useState({});
  const [newKeyData, setNewKeyData]         = useState({
    name: '',
    permissions: ['read:links', 'read:analytics'],
    expires_in_days: null,
  });
  const [createdKey, setCreatedKey]         = useState(null);
  const [copied, setCopied]                 = useState(false);
  const [stats, setStats]                   = useState({ total_keys: 0, active_keys: 0, total_usage: 0 });

  useEffect(() => {
    fetchApiKeys();
    fetchStats();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await api.userApiKeys.getAll();
      setApiKeys(data.api_keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.userApiKeys.getStats();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }
    try {
      setCreating(true);
      const data = await api.userApiKeys.create({
        name: newKeyData.name,
        permissions: newKeyData.permissions,
        expires_in_days: newKeyData.expires_in_days,
      });
      setCreatedKey(data.api_key);
      toast.success('API key created successfully!');
      setNewKeyData({ name: '', permissions: ['read:links', 'read:analytics'], expires_in_days: null });
      setShowCreateDialog(false);
      await fetchApiKeys();
      await fetchStats();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(error.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Revoke this API key? This action cannot be undone.')) return;
    try {
      await api.userApiKeys.revoke(keyId);
      toast.success('API key revoked');
      await fetchApiKeys();
      await fetchStats();
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Delete this API key? This action cannot be undone.')) return;
    try {
      await api.userApiKeys.delete(keyId);
      toast.success('API key deleted');
      await fetchApiKeys();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const permissionOptions = [
    { value: 'read:links',      label: 'Read Links' },
    { value: 'write:links',     label: 'Write Links' },
    { value: 'read:analytics',  label: 'Read Analytics' },
    { value: 'read:campaigns',  label: 'Read Campaigns' },
    { value: 'write:campaigns', label: 'Write Campaigns' },
  ];

  const statCards = [
    { label: 'Total Keys',      value: stats.total_keys  ?? 0, icon: Key,      color: 'text-blue-400',    glow: 'rgba(59,130,246,0.12)'   },
    { label: 'Active Keys',     value: stats.active_keys ?? 0, icon: Shield,   color: 'text-emerald-400', glow: 'rgba(16,185,129,0.12)'  },
    { label: 'Total Requests',  value: stats.total_usage ?? 0, icon: Activity, color: 'text-purple-400',  glow: 'rgba(168,85,247,0.12)'  },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-white">API Keys</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Manage access credentials for the Brain Link Tracker API
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <button className="btn-primary shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Create New Key
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key to access the Brain Link Tracker API
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Key Name
                </label>
                <input
                  className="enterprise-input w-full"
                  placeholder="e.g., My App, Production Key"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Permissions
                </label>
                <div className="space-y-2">
                  {permissionOptions.map((perm) => (
                    <label key={perm.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={newKeyData.permissions.includes(perm.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyData({ ...newKeyData, permissions: [...newKeyData.permissions, perm.value] });
                          } else {
                            setNewKeyData({ ...newKeyData, permissions: newKeyData.permissions.filter((p) => p !== perm.value) });
                          }
                        }}
                        className="rounded border-white/20 accent-blue-500"
                      />
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Expires In Days — leave empty for no expiration
                </label>
                <input
                  className="enterprise-input w-full"
                  type="number"
                  min="1"
                  placeholder="e.g., 90"
                  value={newKeyData.expires_in_days || ''}
                  onChange={(e) =>
                    setNewKeyData({ ...newKeyData, expires_in_days: e.target.value ? parseInt(e.target.value) : null })
                  }
                />
              </div>

              <button
                onClick={handleCreateKey}
                disabled={creating}
                className="btn-primary w-full"
              >
                {creating ? (
                  <>
                    <div className="relative w-4 h-4 mr-2">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                    </div>
                    Creating…
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" /> Create API Key
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stat micro-cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <StatMicroCard key={s.label} index={i} {...s} />
        ))}
      </div>

      {/* ── Created key success panel ── */}
      <AnimatePresence>
        {createdKey && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            style={{
              ...glassCard,
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 0 30px rgba(16,185,129,0.08)',
            }}
            className="p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">API Key Created — Save it now!</span>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="text-white/30 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              This key will never be shown again. Copy it and store it securely.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdKey.key}
                className="enterprise-input flex-1 font-mono text-sm text-emerald-300"
                style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}
              />
              <button
                onClick={() => copyToClipboard(createdKey.key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: copied ? '#10b981' : 'rgba(255,255,255,0.7)',
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── API Keys list ── */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.21, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Your API Keys</span>
          </div>
          {loading && (
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Content */}
        {!loading && apiKeys.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Key className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-sm font-medium text-white/50">No API keys</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Create one to get started</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <AnimatePresence>
              {apiKeys.map((key, i) => {
                const isActive = key.status === 'active';
                return (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition-colors"
                  >
                    {/* Left: name + prefix */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{key.name}</span>
                        <span
                          className="font-mono text-[11px] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          {key.key_prefix}••••••
                        </span>
                        {/* Status dot */}
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isActive ? '#10b981' : '#64748b' }}
                          />
                          <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: isActive ? '#10b981' : '#64748b' }}
                          >
                            {key.status}
                          </span>
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        <span>Expires {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}</span>
                        {key.last_used && <span>Last used {new Date(key.last_used).toLocaleDateString()}</span>}
                      </div>

                      {/* Permissions + usage */}
                      <div className="flex flex-wrap items-center gap-2">
                        {(key.permissions || []).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(59,130,246,0.08)', color: 'rgba(147,197,253,0.7)', border: '1px solid rgba(59,130,246,0.15)' }}
                          >
                            {p}
                          </span>
                        ))}
                        {key.usage_count !== undefined && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                          >
                            {key.usage_count ?? 0} requests
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Copy prefix */}
                      <button
                        onClick={() => copyToClipboard(key.key_prefix)}
                        title="Copy prefix"
                        className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Revoke (active only) */}
                      {isActive && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-amber-400 hover:border-amber-400/30 bg-transparent px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          title="Revoke key"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-red-400 hover:border-red-400/30 bg-transparent px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* "Key shown once" note */}
        <div
          className="px-5 py-3 border-t flex items-center gap-2 text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          Key is only shown once at creation time — store it securely.
        </div>
      </motion.div>

      {/* ── API docs note ── */}
      <motion.div
        style={{ ...glassCard, border: '1px solid rgba(59,130,246,0.15)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="px-5 py-4 flex items-start gap-3"
      >
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-300">API Documentation</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Visit our{' '}
            <a href="/api/docs" className="text-blue-400 underline hover:no-underline">
              API documentation
            </a>{' '}
            to learn how to authenticate and use your keys.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserApiKeyManager;
