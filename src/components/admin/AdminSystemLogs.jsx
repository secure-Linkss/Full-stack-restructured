import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, ShieldCheck, ShieldBan, ShieldAlert, Cpu, Network, Zap, Shield, RotateCw, Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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

const LOG_LEVELS = ['all', 'info', 'warning', 'error'];

const LogLevelBadge = ({ level }) => {
  const l = (level || '').toLowerCase();
  if (l === 'error' || l === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse inline-block" />
        CRITICAL
      </span>
    );
  }
  if (l === 'warn' || l === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] inline-block" />
        WARNING
      </span>
    );
  }
  if (l === 'debug') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
        DEBUG
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
      INFO
    </span>
  );
};

const MetricCard = ({ icon: Icon, iconColor, topColor, label, value, valueColor }) => (
  <motion.div
    custom={0} variants={cardVariants} initial="hidden" animate="visible"
    className="relative overflow-hidden"
    style={{ ...glassCard, borderLeft: `3px solid ${topColor}` }}
  >
    <div className="p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Icon className="w-3 h-3" style={{ color: iconColor }} />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      </div>
      <h3 className="text-2xl font-bold font-mono" style={{ color: valueColor || '#fff' }}>{value}</h3>
    </div>
  </motion.div>
);

const exportLogs = (logs) => {
  const rows = [['ID', 'Timestamp', 'Level', 'Source', 'IP', 'Message']];
  logs.forEach(l => {
    rows.push([
      l.id || '',
      new Date(l.timestamp || l.created_at).toISOString(),
      l.level || '',
      l.source || l.target_type || '',
      l.ip || l.ip_address || '',
      (l.message || l.action || '').replace(/,/g, ';'),
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system_logs_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Logs exported successfully.');
};

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [threatMetrics, setThreatMetrics] = useState({ requests: 0, blocks: 0, attacks: 0, uptime: '0.00%' });
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(false);
  const logEndRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, threatsData, firewallStats] = await Promise.all([
        api.adminLogs.getAll().catch(() => []),
        api.adminSecurity.getThreats().catch(() => []),
        api.quantum.getSecurityDashboard().catch(() => ({ requests: 0, blocks: 0, attacks: 0, uptime: 'Unknown' }))
      ]);

      setLogs(Array.isArray(logsData) ? logsData : []);
      setBlockedIPs(Array.isArray(threatsData) ? threatsData : []);
      setThreatMetrics({
        requests: firewallStats.requests || 0,
        blocks: firewallStats.blocks || 0,
        attacks: firewallStats.attacks || 0,
        uptime: firewallStats.uptime || 'Unknown'
      });
    } catch {
      toast.error('Failed to communicate with Firewall/Audit API via Quantum Engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => {
    if (levelFilter === 'all') return true;
    const lvl = (l.level || '').toLowerCase();
    if (levelFilter === 'error') return lvl === 'error' || lvl === 'critical';
    if (levelFilter === 'warning') return lvl === 'warn' || lvl === 'warning';
    if (levelFilter === 'info') return lvl === 'info' || !lvl;
    return true;
  });

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h3 className="text-2xl font-bold font-heading text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#10b981]" /> Auditing & System Security
        </h3>
        <p className="text-sm text-white/40 mt-1">Live polling of Quantum Direction Engine firewall intercepts and system audit logs.</p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={Cpu} iconColor="#10b981" topColor="#10b981" label="Router Traffic" value={threatMetrics.requests.toLocaleString()} valueColor="#fff" />
        <MetricCard icon={ShieldAlert} iconColor="#f59e0b" topColor="#f59e0b" label="Firewall Blocks" value={threatMetrics.blocks.toLocaleString()} valueColor="#f59e0b" />
        <MetricCard icon={AlertTriangle} iconColor="#ef4444" topColor="#ef4444" label="Prevented Intrusions" value={threatMetrics.attacks.toLocaleString()} valueColor="#ef4444" />
        <MetricCard icon={Zap} iconColor="#3b82f6" topColor="#3b82f6" label="Logic Node Uptime" value={threatMetrics.uptime} valueColor="#3b82f6" />
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-[#141d2e] border border-[#1e2d47]">
          <TabsTrigger value="audit" className="text-xs uppercase tracking-widest"><FileText className="w-3.5 h-3.5 mr-2" />Audit Ledger</TabsTrigger>
          <TabsTrigger value="firewall" className="text-xs uppercase tracking-widest"><ShieldBan className="w-3.5 h-3.5 mr-2" />Active Firewall Drops</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* AUDIT LEDGER */}
          <TabsContent value="audit">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" style={glassCard} className="overflow-hidden">
              {/* Toolbar */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Network className="w-3.5 h-3.5 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Global Systems Audit Ledger</h3>
                    <p className="text-[10px] text-white/30">{filteredLogs.length} entries</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Level filters */}
                  <div className="flex gap-1">
                    {LOG_LEVELS.map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors"
                        style={{
                          background: levelFilter === lvl ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                          color: levelFilter === lvl ? '#3b82f6' : 'rgba(255,255,255,0.35)',
                          border: levelFilter === lvl ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  {/* Auto-scroll toggle */}
                  <button
                    onClick={() => setAutoScroll(p => !p)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors"
                    style={{
                      background: autoScroll ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      color: autoScroll ? '#10b981' : 'rgba(255,255,255,0.35)',
                      border: autoScroll ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <ChevronDown className="w-3 h-3 inline mr-1" />Auto-scroll
                  </button>
                  {/* Export */}
                  <button
                    onClick={() => exportLogs(filteredLogs)}
                    className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white/40 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Download className="w-3 h-3" />Export
                  </button>
                  {/* Refresh */}
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white/40 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />Sync
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="px-5 py-2.5 flex gap-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {logs.filter(l => l.level === 'info' || !l.level).length} INFO
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {logs.filter(l => l.level?.includes('warn')).length} WARN
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {logs.filter(l => l.level === 'error' || l.level === 'critical').length} CRITICAL
                </span>
              </div>

              {/* Log Table */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                  </div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/25">
                  <FileText className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No logs match the current filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10" style={{ background: 'rgba(8,15,35,0.95)' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Event ID', 'Timestamp', 'Severity', 'Source', 'IP', 'Message'].map((h, i) => (
                          <th key={i} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => {
                        const isError = (log.level || '').toLowerCase() === 'error' || (log.level || '').toLowerCase() === 'critical';
                        const isWarn = (log.level || '').toLowerCase().includes('warn');
                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: i % 2 === 0
                                ? isError ? 'rgba(239,68,68,0.04)' : isWarn ? 'rgba(245,158,11,0.03)' : 'rgba(255,255,255,0.01)'
                                : 'transparent',
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] font-mono text-white/30">{log.id || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-mono text-white/60 whitespace-nowrap">
                                {new Date(log.timestamp || log.created_at).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <LogLevelBadge level={log.level} />
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-medium text-[#3b82f6]">{log.source || log.target_type || 'Unknown'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-mono text-white/50 tracking-widest">{log.ip || log.ip_address || 'N/A'}</span>
                            </td>
                            <td className="px-4 py-2.5 max-w-[300px]">
                              <span className="text-xs text-white/70 line-clamp-1">{log.message || log.action}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div ref={logEndRef} />
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* FIREWALL DROPS */}
          <TabsContent value="firewall">
            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="overflow-hidden"
              style={{ background: 'rgba(20,5,5,0.85)', backdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14 }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <ShieldBan className="w-4 h-4 text-[#ef4444]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#ef4444] uppercase tracking-widest">Live Quarantined IP Arrays</h3>
                    <p className="text-[10px] text-[#ef4444]/50 mt-0.5">Hardware and application-layer banned network nodes.</p>
                  </div>
                </div>
                <button
                  onClick={fetchData}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                  style={{ border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Layer 7
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 animate-spin" />
                  </div>
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/25">
                  <ShieldCheck className="w-10 h-10 mb-2 opacity-30 text-[#10b981]" />
                  <p className="text-sm font-bold text-white/40">No active threats detected.</p>
                  <p className="text-xs mt-1">Routing matrix is optimal.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ '--tw-divide-opacity': 0.04 }}>
                  {blockedIPs.map((node, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex justify-between items-center px-5 py-4 transition-colors hover:bg-[#ef4444]/05"
                      style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                          <code className="text-sm font-mono font-bold text-[#ef4444] tracking-widest">{node.ip || node.ip_address}</code>
                        </div>
                        <p className="text-xs text-white/30 ml-3.5">Reason: {node.reason || 'DDoS Node Vector Threshold Reached'}</p>
                      </div>
                      <div className="text-xs text-white/25 font-mono text-right">
                        {new Date(node.time || node.created_at).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSystemLogs;
