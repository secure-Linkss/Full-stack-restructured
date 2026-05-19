import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Trash2, CheckCircle, ShieldAlert, RefreshCw, Server, Star } from 'lucide-react';
import { toast } from 'sonner';
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

const glassInput = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
};

const getReputation = (domain) => {
  if (!domain.is_verified) return { label: 'Unverified', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
  if ((domain.total_clicks || 0) > 100) return { label: 'Strong', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
  if ((domain.total_clicks || 0) > 10) return { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  return { label: 'Weak', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
};

const DomainStatusBadge = ({ isVerified, isActive }) => {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#10b981]/10 text-[#10b981]">
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b]">
        <ShieldAlert className="w-3 h-3" /> Pending
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/5 text-white/30">
      Inactive
    </span>
  );
};

const AdminDomains = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [settingPrimary, setSettingPrimary] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const data = await api.adminSettings.getDomains();
      const list = data?.domains || data || [];
      setDomains(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error('Failed to load global domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
    api.admin?.getPrimaryDomain?.().then(r => {
      if (r?.primary_domain) setPrimaryDomain(r.primary_domain);
    }).catch(() => {});
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain || !newDomain.includes('.')) return toast.error('Enter a valid FQDN / Hostname');
    setAdding(true);
    try {
      await api.adminSettings.addDomain({ domain: newDomain });
      toast.success(`Globally integrated domain: ${newDomain}`);
      setNewDomain('');
      fetchDomains();
    } catch (error) {
      toast.error(`Failed to execute Add Node: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`PERMANENTLY remove ${name} from the global routing pool? Active short URLs will break!`)) return;
    try {
      await api.adminSettings.deleteDomain(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      toast.success(`Domain ${name} nuked from pool.`);
    } catch (error) {
      toast.error(`Failed to purge domain: ${error.message}`);
    }
  };

  const handleToggleState = async (id, currentStatus, name) => {
    const newState = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      await api.adminSettings.updateDomain(id, { status: newState });
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: newState } : d));
      toast.success(`Global Router ${name} is now ${newState.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to flip switch: ${error.message}`);
    }
  };

  const handleSetPrimary = async (domainName) => {
    setSettingPrimary(true);
    try {
      const res = await api.admin.setPrimaryDomain(domainName);
      setPrimaryDomain(domainName);
      toast.success(res?.message || `Primary domain set to ${domainName}`);
    } catch {
      toast.error('Failed to set primary domain.');
    } finally {
      setSettingPrimary(false);
    }
  };

  const handleAutoDetect = async () => {
    const detected = window.location.hostname;
    await handleSetPrimary(detected);
  };

  const handleVerify = async (id, name) => {
    setVerifyingId(id);
    toast.promise(
      api.adminSettings.verifyDomain(id).finally(() => setVerifyingId(null)),
      {
        loading: `Running DNS Verification against ${name}...`,
        success: () => { fetchDomains(); return `${name} propagated and verified.`; },
        error: 'DNS Verification Failed. Check NS/A Records.'
      }
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#3b82f6]" /> Global Domain Management
        </h3>
        <p className="text-sm text-white/40 mt-1">Administer the array of root endpoints available for users to route masking URLs through.</p>
      </motion.div>

      {/* Primary Domain Banner */}
      <motion.div
        custom={0} variants={cardVariants} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Star className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Primary Domain</p>
            <p className="text-xs text-white/40">
              {primaryDomain ? <code className="font-mono text-[#f59e0b]">{primaryDomain}</code> : 'No primary domain set'}
            </p>
          </div>
        </div>
        <button
          onClick={handleAutoDetect}
          disabled={settingPrimary}
          className="text-xs px-3 py-1.5 rounded-lg text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors disabled:opacity-50"
          style={{ border: '1px solid rgba(245,158,11,0.25)' }}
        >
          Auto-Detect ({window.location.hostname})
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Add Domain Panel */}
        <motion.div
          custom={1} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-1 p-5 lg:sticky lg:top-6"
          style={glassCard}
        >
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Server className="w-3.5 h-3.5 text-[#3b82f6]" />
            </div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Add Routing Core</h3>
          </div>
          <p className="text-[11px] text-white/35 mb-4">
            Integrate custom domains that bypass network ad-blockers. These populate the dropdowns universally.
          </p>
          <label className="text-[10px] font-semibold text-[#3b82f6] uppercase tracking-wider mb-1.5 block">FQDN / Hostname</label>
          <input
            type="text"
            placeholder="e.g. tracking.yourbrand.com"
            style={{ ...glassInput, fontFamily: 'monospace' }}
            className="w-full px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors mb-4"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
          />
          <button
            onClick={handleAddDomain}
            disabled={adding}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
          >
            {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Integrate Domain Node
          </button>
        </motion.div>

        {/* Domain List */}
        <motion.div
          custom={2} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-2 overflow-hidden"
          style={glassCard}
        >
          <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Routing Pool</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#3b82f6]/10 text-[#3b82f6]">
                {domains.length} Nodes
              </span>
              <button
                onClick={fetchDomains}
                className="p-1.5 rounded-lg text-white/30 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                </div>
              </div>
            ) : domains.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <Globe className="w-10 h-10 mb-3 opacity-20 animate-pulse" />
                <p className="text-sm font-semibold">No custom subnets established.</p>
                <p className="text-xs mt-1 text-white/20">Integrate a routing core to bypass browser blocks.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-widest px-5 py-3">Hostname</th>
                    <th className="text-center text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-3">Status</th>
                    <th className="text-center text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 py-3">Reputation</th>
                    <th className="text-right text-[10px] font-semibold text-white/30 uppercase tracking-widest px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain, i) => {
                    const isActive = domain.is_active !== false;
                    const isVerified = domain.is_verified;
                    const reputation = getReputation(domain);
                    const domainName = domain.domain || domain.name || '';
                    return (
                      <motion.tr
                        key={domain.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="group transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                            <div>
                              <code className="text-sm text-white font-mono">{domainName}</code>
                              <p className="text-[10px] text-white/30 mt-0.5">{domain.description || domain.domain_type || 'Custom'} · ID:{domain.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <DomainStatusBadge isVerified={isVerified} isActive={isActive} />
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: reputation.bg, color: reputation.color, border: `1px solid ${reputation.border}` }}
                          >
                            {reputation.label}
                          </span>
                          <div className="flex gap-4 justify-center mt-1.5">
                            <div className="text-center">
                              <p className="text-xs font-bold text-white">{domain.total_links || 0}</p>
                              <p className="text-[9px] text-white/30">Links</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-white">{domain.total_clicks || 0}</p>
                              <p className="text-[9px] text-white/30">Clicks</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end items-center gap-1.5">
                            {primaryDomain === domainName ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b]">
                                <Star className="w-3 h-3" /> Primary
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetPrimary(domainName)}
                                disabled={settingPrimary}
                                className="text-[10px] px-2 py-0.5 rounded-lg text-[#f59e0b]/60 hover:text-[#f59e0b] transition-colors"
                                style={{ border: '1px solid rgba(245,158,11,0.15)' }}
                              >
                                Set Primary
                              </button>
                            )}
                            {!isVerified && (
                              <button
                                onClick={() => handleVerify(domain.id, domainName)}
                                disabled={verifyingId === domain.id}
                                className="text-[10px] px-2 py-0.5 rounded-lg text-[#f59e0b] hover:bg-[#f59e0b] hover:text-white transition-all"
                                style={{ border: '1px solid rgba(245,158,11,0.3)' }}
                              >
                                {verifyingId === domain.id ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : 'Verify'}
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleState(domain.id, isActive ? 'active' : 'disabled', domainName)}
                              className="text-[10px] px-2 py-0.5 rounded-lg transition-all"
                              style={!isActive
                                ? { border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }
                                : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }
                              }
                            >
                              {!isActive ? 'Enable' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleRemove(domain.id, domainName)}
                              className="p-1.5 rounded-lg text-white/20 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDomains;
