import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, MapPin, Monitor, Smartphone, Tablet, RefreshCw, Search,
  Clock, Fingerprint, LocateFixed, Eye, X, ChevronLeft, ChevronRight,
  ShieldAlert, TrendingUp, Users, Shield, MousePointerClick,
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

const ACCENT = {
  click:         'bg-blue-500',
  bot_blocked:   'bg-red-500',
  lead:          'bg-emerald-500',
  email_captured:'bg-emerald-500',
  redirect:      'bg-purple-500',
  default:       'bg-slate-500',
};

const EVENT_BADGE = {
  'On Page':    { bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-500' },
  'Redirected': { bg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-500' },
  'Open':       { bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dot: 'bg-amber-500' },
  'Blocked':    { bg: 'bg-red-500/10 text-red-400 border border-red-500/20', dot: 'bg-red-500' },
  default:      { bg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-500' },
};

// ── Helpers ────────────────────────────────────────────────────
const getAccentColor = (ev) => {
  const s = (ev.status || '').toLowerCase();
  const t = (ev.event_type || '').toLowerCase();
  if (s.includes('block') || t.includes('bot')) return ACCENT.bot_blocked;
  if (s.includes('on page') || t.includes('lead') || t.includes('email')) return ACCENT.lead;
  if (s.includes('redirect') || t.includes('redirect')) return ACCENT.redirect;
  if (t.includes('click')) return ACCENT.click;
  return ACCENT.default;
};

const normalizeStatus = (status) => {
  if (!status) return 'Unknown';
  const s = status.toLowerCase();
  if (s.includes('on page') || s.includes('on_page')) return 'On Page';
  if (s.includes('redirect')) return 'Redirected';
  if (s.includes('open')) return 'Open';
  if (s.includes('block')) return 'Blocked';
  return status;
};

const FILTER_PILLS = [
  { id: 'all',        label: 'All' },
  { id: 'redirected', label: 'Clicks' },
  { id: 'blocked',    label: 'Bots' },
  { id: 'on page',    label: 'Leads' },
];

// ── Inspect Modal ──────────────────────────────────────────────
const InspectModal = ({ event: ev, onClose }) => {
  if (!ev) return null;
  const fields = [
    { label: 'Event ID',        value: ev.id || ev.uniqueId || ev.unique_id },
    { label: 'Timestamp',       value: ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'N/A' },
    { label: 'Status',          value: normalizeStatus(ev.status) },
    { label: 'Detailed Status', value: ev.detailedStatus || ev.detailed_status || '—' },
    { label: 'IP Address',      value: ev.ip || ev.ip_address || 'N/A' },
    { label: 'Device',          value: ev.device || ev.userAgent || ev.user_agent || 'N/A' },
    { label: 'OS',              value: ev.os || 'N/A' },
    { label: 'Browser',         value: ev.browser || 'N/A' },
    { label: 'City',            value: ev.city || ev.location?.city || 'N/A' },
    { label: 'Region',          value: ev.region || ev.location?.region || 'N/A' },
    { label: 'Postcode/ZIP',    value: ev.zipCode || ev.zip_code || ev.postcode || ev.zip || 'N/A' },
    { label: 'Country',         value: ev.country || ev.location?.country || 'N/A' },
    { label: 'ISP',             value: ev.isp || ev.ispDetails || ev.location?.isp || 'Unknown' },
    { label: 'Referrer',        value: ev.referrer || 'Direct' },
    { label: 'Campaign',        value: ev.campaignName || ev.campaign_name || ev.link_name || 'N/A' },
    { label: 'Link Short Code', value: ev.linkShortCode || ev.short_code || 'N/A' },
    { label: 'Quantum Stage',   value: ev.quantumStage || ev.quantum_stage || 'N/A' },
    { label: 'Threat Score',    value: ev.threatScore ?? ev.threat_score ?? 0 },
    { label: 'Is Bot',          value: ev.isBot ? 'Yes' : 'No' },
    { label: 'Captured Email',  value: ev.emailCaptured || ev.captured_email || ev.visitor_email || 'None' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg mx-4 relative overflow-hidden shadow-2xl"
          style={glassCard}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* top accent bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Event Inspection</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {fields.map((f, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {f.label}
                </span>
                <span className="text-xs font-medium text-white font-mono">{String(f.value)}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2">
            <button
              onClick={() => {
                api.liveActivity.blockIP(ev.ip || ev.ip_address);
                toast.success('IP flagged');
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Block IP
            </button>
            <button
              onClick={onClose}
              className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main Component ─────────────────────────────────────────────
const LiveActivity = () => {
  const [loading, setLoading]           = useState(true);
  const [activities, setActivities]     = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage]                 = useState(1);
  const [inspectEvent, setInspectEvent] = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(new Date());
  const [timeAgo, setTimeAgo]           = useState('just now');
  const [connected, setConnected]       = useState(false);
  const pageSize = 20;

  // timeAgo counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diff < 10)  setTimeAgo('just now');
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}m ago`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.liveActivity.getEvents({ page, limit: pageSize });
      const events = response?.events || response || [];
      setActivities(Array.isArray(events) ? events : []);
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch live activity:', error);
      setConnected(false);
      if (activities.length === 0) toast.error('Failed to connect to live event stream.');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [page]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const handleRefresh = () => {
    setLoading(true);
    fetchActivities();
    toast.info('Stream refreshed');
  };

  const getDeviceIcon = (device) => {
    const d = (device || '').toLowerCase();
    if (d.includes('iphone') || d.includes('android') || d.includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  // Client-side filtering
  const filtered = activities.filter((ev) => {
    const matchesStatus =
      filterStatus === 'all' ||
      normalizeStatus(ev.status).toLowerCase().includes(filterStatus);
    const matchesSearch =
      !searchQuery ||
      (ev.ip || ev.ip_address || '').includes(searchQuery) ||
      (ev.uniqueId || ev.unique_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.city || ev.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.country || ev.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.campaignName || ev.campaign_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages      = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedEvents = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Metrics ──
  const metrics = [
    {
      label: 'Total Events',
      value: activities.length,
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-400',
      glow: 'rgba(59,130,246,0.15)',
    },
    {
      label: 'Real Visitors',
      value: activities.filter((e) => normalizeStatus(e.status) === 'On Page').length,
      icon: <Users className="w-5 h-5" />,
      color: 'text-emerald-400',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Bots Blocked',
      value: activities.filter((e) => normalizeStatus(e.status) === 'Blocked').length,
      icon: <Shield className="w-5 h-5" />,
      color: 'text-red-400',
      glow: 'rgba(239,68,68,0.15)',
    },
    {
      label: 'Leads Captured',
      value: activities.filter((e) => e.emailCaptured || e.captured_email || e.visitor_email).length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-400',
      glow: 'rgba(168,85,247,0.15)',
    },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-heading text-white">Live Activity</h2>
            {/* animated LIVE badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
              style={{
                background: connected ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
                color: connected ? '#10b981' : '#64748b',
              }}
            >
              <span
                className="relative flex w-2 h-2"
              >
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                )}
                <span
                  className="relative inline-flex rounded-full w-2 h-2"
                  style={{ background: connected ? '#10b981' : '#64748b' }}
                />
              </span>
              {connected ? 'LIVE' : 'OFFLINE'}
            </motion.span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Real-time tracking events · Last updated:{' '}
            <span className="font-mono text-emerald-400">{timeAgo}</span>
          </p>
        </div>
        <button className="btn-secondary" onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Stream
        </button>
      </div>

      {/* ── 4 Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            style={{ ...glassCard, boxShadow: `0 0 30px ${m.glow}` }}
            className="p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {m.label}
                </p>
                <p className="text-3xl font-heading text-white mt-1 tabular-nums">{m.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-white/5 ${m.color}`}>{m.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Pills + Search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => { setFilterStatus(pill.id); setPage(1); }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filterStatus === pill.id ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: filterStatus === pill.id ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                border: filterStatus === pill.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by IP, UID, location, campaign..."
            className="enterprise-input w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
      </div>

      {/* ── Live Event Feed ── */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        {/* top shimmer */}
        <div className="h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0" />

        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Connecting to event stream…</p>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.12)' }} />
            <p className="text-sm font-medium text-white/50">No events match current filters</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            <AnimatePresence initial={false}>
              {paginatedEvents.map((ev, i) => {
                const loc        = ev.location || {};
                const city       = ev.city || loc.city || 'Unknown';
                const region     = ev.region || loc.region || '';
                const country    = ev.country || loc.country || '';
                const postcode   = ev.zipCode || ev.zip_code || loc.postcode || ev.postcode || ev.zip || '';
                const ipAddr     = ev.ip || ev.ip_address || 'N/A';
                const uid        = ev.uniqueId || ev.unique_id || String(ev.id ?? '').substring(0, 12) || 'N/A';
                const emailCapt  = ev.emailCaptured || ev.captured_email || ev.visitor_email;
                const deviceStr  = ev.device || ev.user_agent || ev.userAgent || 'Unknown';
                const ispStr     = ev.isp || ev.ispDetails || loc.isp || '';
                const status     = normalizeStatus(ev.status);
                const badge      = EVENT_BADGE[status] || EVENT_BADGE.default;
                const accentColor = getAccentColor(ev);
                const linkName   = ev.campaignName || ev.campaign_name || ev.link_name || '—';

                // country flag via regional indicator symbols
                const flagEmoji = country.length === 2
                  ? String.fromCodePoint(...[...country.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
                  : country ? '🌐' : '';

                return (
                  <motion.div
                    key={ev.id || i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="group flex items-stretch hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left accent strip */}
                    <div className={`w-0.5 shrink-0 rounded-full my-3 ml-3 ${accentColor}`} />

                    {/* Row content */}
                    <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
                      {/* Device icon + IP */}
                      <div className="shrink-0 flex flex-col items-center gap-1 w-20">
                        <span className="text-white/40">{getDeviceIcon(deviceStr)}</span>
                        <span className="font-mono text-[10px] text-white/40 truncate w-full text-center">{ipAddr}</span>
                      </div>

                      {/* Event type badge */}
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${status === 'On Page' ? 'animate-pulse' : ''}`} />
                        {status}
                      </span>

                      {/* Link name */}
                      <span className="hidden sm:block text-sm text-white/60 truncate min-w-0 flex-1">
                        {linkName}
                      </span>

                      {/* Email capture */}
                      {emailCapt && (
                        <span className="hidden md:block font-mono text-xs text-blue-400 truncate">
                          ✉ {emailCapt}
                        </span>
                      )}

                      {/* Location + flag */}
                      <div className="hidden lg:flex items-center gap-1 shrink-0 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {flagEmoji && <span className="text-base leading-none">{flagEmoji}</span>}
                        <span>{city}{region ? `, ${region}` : ''}</span>
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Clock className="w-3 h-3" />
                        {ev.timestamp
                          ? new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : '--:--:--'}
                      </div>

                      {/* Inspect */}
                      <button
                        onClick={() => setInspectEvent(ev)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          border: '1px solid rgba(59,130,246,0.2)',
                          color: '#93c5fd',
                        }}
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
          >
            <span>
              Showing {Math.min(pageSize, paginatedEvents.length)} of {filtered.length} events
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tabular-nums font-medium">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={paginatedEvents.length < pageSize}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Inspect Modal */}
      {inspectEvent && (
        <InspectModal event={inspectEvent} onClose={() => setInspectEvent(null)} />
      )}
    </div>
  );
};

export default LiveActivity;
