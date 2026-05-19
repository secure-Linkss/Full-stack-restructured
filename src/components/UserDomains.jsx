import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Trash2, RefreshCw, AlertTriangle,
  Activity, Server, Settings2, ShieldCheck, HeartPulse,
  XCircle, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

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

const STATUS_CONFIG = {
  verified:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  icon: ShieldCheck, label: 'Verified'  },
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  icon: AlertTriangle, label: 'Pending' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   icon: XCircle,      label: 'Failed'   },
  disabled:  { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)',  icon: Settings2,    label: 'Disabled' },
};

const getStatusCfg = (rawStatus) => {
  const s = (rawStatus || 'pending').toString().toLowerCase();
  return STATUS_CONFIG[s] || STATUS_CONFIG.pending;
};

const UserDomains = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [healthCheckingId, setHealthCheckingId] = useState(null);

  const DOMAIN_LIMIT = 10;

  const fetchDomains = async () => {
    try {
      const response = await api.domains.getAll();
      const list = response?.domains || response || [];
      setDomains(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDomains(); }, []);

  const handleAddDomain = async () => {
    if (domains.length >= DOMAIN_LIMIT)
      return toast.error(`You have reached the maximum limit of ${DOMAIN_LIMIT} custom domains.`);
    if (!newDomain || !newDomain.includes('.'))
      return toast.error('Enter a valid domain name (e.g. click.yourbrand.com)');

    setAdding(true);
    try {
      await api.domains.add({ domain: newDomain });
      toast.success(`Domain ${newDomain} added. Please configure DNS.`);
      setNewDomain('');
      fetchDomains();
    } catch (error) {
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name}? Existing tracking links will break permanently.`)) return;
    try {
      await api.domains.delete(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      toast.success(`Domain ${name} removed.`);
    } catch (error) {
      toast.error(`Failed to remove domain: ${error.message}`);
    }
  };

  const verifyDns = async (id, name) => {
    setVerifyingId(id);
    toast.info(`Verifying DNS for ${name}...`);
    try {
      await api.domains.verify(id);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'Verified' } : d));
      toast.success(`Domain ${name} verified!`);
    } catch (error) {
      toast.error(`DNS verification failed: ${error.message}`);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'Failed' } : d));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleHealthCheck = async (id, name) => {
    setHealthCheckingId(id);
    try {
      await api.domains.healthCheck(id);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, last_checked: new Date().toISOString() } : d));
      toast.success(`${name} backend routing is optimal.`);
    } catch {
      toast.error(`${name} is failing health checks!`);
    } finally {
      setHealthCheckingId(null);
    }
  };

  const handleSetDefault = async (id, name) => {
    try {
      await api.domains.setDefault(id);
      setDomains(prev => prev.map(d => ({ ...d, is_default: d.id === id })));
      toast.success(`${name} set as default domain.`);
    } catch (error) {
      toast.error(`Failed to set default: ${error.message}`);
    }
  };

  const atLimit = domains.length >= DOMAIN_LIMIT;

  return (
    <div className="space-y-4">
      {/* Header card: Add Domain */}
      <motion.div
        style={glassCard}
        className="p-5"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={cardVariants}
      >
        <div
          className="flex items-center justify-between mb-4 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Custom Domains</h3>
          </div>

          {/* Domain limit badge */}
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: atLimit ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
              border: `1px solid ${atLimit ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              color: atLimit ? '#ef4444' : '#10b981',
            }}
          >
            {domains.length} / {DOMAIN_LIMIT} domains
          </span>
        </div>

        {/* DNS instructions */}
        <div
          className="p-3 rounded-xl mb-4 space-y-2"
          style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.15)',
          }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1 flex items-center gap-1">
              <Settings2 className="w-3 h-3" /> CNAME Record
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Point a CNAME from your domain to{' '}
              <code
                className="px-1.5 py-0.5 rounded font-mono"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)' }}
              >
                route.brainlink.to
              </code>
            </p>
          </div>
          <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', paddingTop: 8 }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1 flex items-center gap-1">
              <Server className="w-3 h-3" /> Apex A Record
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              For root domains, use an A Record pointing to{' '}
              <code
                className="px-1.5 py-0.5 rounded font-mono"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)' }}
              >
                104.21.XX.XX
              </code>
            </p>
          </div>
        </div>

        {/* Add domain input row */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. click.yourbrand.com"
            className="enterprise-input w-full font-mono text-sm"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
            disabled={atLimit || adding}
          />
          <button
            onClick={handleAddDomain}
            disabled={adding || atLimit}
            className="btn-primary flex items-center gap-1.5 px-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
              </div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="text-sm">{atLimit ? 'Limit Reached' : 'Add Domain'}</span>
          </button>
        </div>
      </motion.div>

      {/* Domains list */}
      <motion.div
        style={glassCard}
        className="overflow-hidden"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={cardVariants}
      >
        {/* List header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Configured Hostnames
          </span>
          <button
            onClick={fetchDomains}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading domains...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && domains.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Globe className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No custom domains yet
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Add your first domain above to start routing links.
            </p>
          </div>
        )}

        {/* Domain rows */}
        {!loading && domains.map((domain, idx) => {
          const domainName = domain.name || domain.domain;
          const rawStatus = domain.status || 'pending';
          const statusCfg = getStatusCfg(rawStatus);
          const StatusIcon = statusCfg.icon;
          const isVerified = rawStatus.toLowerCase() === 'verified';
          const isVerifyingThis = verifyingId === domain.id;
          const isHealthCheckingThis = healthCheckingId === domain.id;
          const isHealthy = !!domain.last_checked;

          return (
            <motion.div
              key={domain.id}
              initial="hidden"
              animate="visible"
              custom={idx}
              variants={cardVariants}
              className="flex items-center justify-between px-5 py-4 gap-4"
              style={{
                borderBottom: idx < domains.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Left: domain name + meta */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Health dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isHealthy ? '#10b981' : 'rgba(255,255,255,0.15)' }}
                  />
                  {isHealthy && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: 'rgba(16,185,129,0.4)' }}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-white truncate">
                      {domainName}
                    </span>
                    {domain.is_default && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}
                      >
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <Activity className="w-3 h-3" />
                      {domain.usage_count || 0} links
                    </span>
                    {domain.last_checked && (
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Checked {new Date(domain.last_checked).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center: status badge */}
              <div className="flex-shrink-0">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{
                    background: statusCfg.bg,
                    border: `1px solid ${statusCfg.border}`,
                    color: statusCfg.color,
                  }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Set Default — only if verified and not already default */}
                {isVerified && !domain.is_default && (
                  <button
                    onClick={() => handleSetDefault(domain.id, domainName)}
                    className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#3b82f6' }}
                    title="Set as default domain"
                  >
                    Set Default
                  </button>
                )}

                {/* Verify DNS — only if not verified */}
                {!isVerified && (
                  <button
                    onClick={() => verifyDns(domain.id, domainName)}
                    disabled={isVerifyingThis}
                    title="Verify DNS"
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    style={{ color: '#f59e0b' }}
                  >
                    {isVerifyingThis ? (
                      <div className="relative w-3.5 h-3.5">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
                      </div>
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Verify</span>
                  </button>
                )}

                {/* Health Check */}
                <button
                  onClick={() => handleHealthCheck(domain.id, domainName)}
                  disabled={isHealthCheckingThis}
                  title="Run health check"
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-60"
                  style={{ color: '#10b981' }}
                >
                  {isHealthCheckingThis ? (
                    <div className="relative w-4 h-4">
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                    </div>
                  ) : (
                    <HeartPulse className="w-4 h-4" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleRemove(domain.id, domainName)}
                  title="Delete domain"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'rgba(239,68,68,0.7)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default UserDomains;
