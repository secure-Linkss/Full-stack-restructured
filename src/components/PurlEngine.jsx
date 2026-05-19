import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Upload, Download, RefreshCw, Trash2, Mail, Link as LinkIcon,
  CheckCircle2, AlertCircle, Clock, BarChart3, Shield, Eye, Plus,
  X, Search, Zap, Globe, Copy,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

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

// ── Shared stat card ───────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    style={glassCard}
    className="p-5 flex items-center justify-between"
  >
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {title}
      </p>
      <h3 className="text-3xl font-heading text-white mt-1 tabular-nums">{value}</h3>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
    </div>
    <div className={`p-3 rounded-xl bg-white/[0.03] ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </motion.div>
);

// ── PURL Generator Tab ─────────────────────────────────────────
const PurlGeneratorTab = ({ links, onGenerated }) => {
  const fileInputRef    = useRef(null);
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [csvFile, setCsvFile]               = useState(null);
  const [preview, setPreview]               = useState([]);
  const [generating, setGenerating]         = useState(false);
  const [result, setResult]                 = useState(null);
  const [dragging, setDragging]             = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    return lines.slice(1, 6).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(parseCSV(ev.target.result));
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) { toast.error('Please drop a .csv file'); return; }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(parseCSV(ev.target.result));
    reader.readAsText(file);
  };

  const generate = async () => {
    if (!selectedLinkId) { toast.error('Select a tracking link first'); return; }
    if (!csvFile) { toast.error('Upload a CSV file first'); return; }
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const finalRes = await api.purl.generateCSV(selectedLinkId, formData);
      setResult(finalRes);
      if (finalRes.success) {
        toast.success(`Generated ${finalRes.created} PURLs`);
        onGenerated();
      } else {
        toast.error(finalRes.error || 'Generation failed');
      }
    } catch {
      toast.error('PURL generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Link selector + upload */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="p-6 space-y-5"
      >
        <div>
          <p className="text-base font-semibold text-white mb-0.5">Generate Personalized URLs</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Upload a CSV with{' '}
            <code className="px-1 rounded bg-white/[0.06] font-mono">email</code> and optional{' '}
            <code className="px-1 rounded bg-white/[0.06] font-mono">name</code> columns.
            A unique tracking link is generated per recipient.
          </p>
        </div>

        {/* Link dropdown */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Select Tracking Link
          </label>
          <select
            className="enterprise-input w-full"
            value={selectedLinkId}
            onChange={(e) => setSelectedLinkId(e.target.value)}
          >
            <option value="">— Choose a link —</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.campaign_name || l.campaignName || `Link #${l.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* CSV drop zone */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Upload CSV
          </label>
          <div
            className="rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{
              border: dragging
                ? '2px dashed rgba(59,130,246,0.6)'
                : csvFile
                ? '2px dashed rgba(16,185,129,0.4)'
                : '2px dashed rgba(255,255,255,0.1)',
              background: dragging ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.01)',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: csvFile ? '#10b981' : 'rgba(255,255,255,0.2)' }}
            />
            <p className="text-sm font-medium" style={{ color: csvFile ? '#10b981' : 'rgba(255,255,255,0.7)' }}>
              {csvFile ? csvFile.name : 'Click or drag to upload CSV'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Required: <code className="bg-white/[0.06] px-1 rounded font-mono">email</code> — Optional:{' '}
              <code className="bg-white/[0.06] px-1 rounded font-mono">name</code>
            </p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!csvFile || !selectedLinkId || generating}
          className="btn-primary w-full"
        >
          {generating ? (
            <>
              <div className="relative w-4 h-4 mr-2">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
              </div>
              Generating…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" /> Generate PURLs
            </>
          )}
        </button>
      </motion.div>

      {/* CSV preview table */}
      <AnimatePresence>
        {preview.length > 0 && (
          <motion.div
            style={glassCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 py-3 border-b text-[10px] font-semibold uppercase tracking-widest"
              style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
            >
              CSV Preview — first {preview.length} rows
            </div>
            <div className="overflow-x-auto">
              <table className="enterprise-table text-xs min-w-full">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map((k) => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => <td key={j}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success result panel */}
      <AnimatePresence>
        {result && result.success && (
          <motion.div
            style={{ ...glassCard, border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.06)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Generation Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Created',  value: result.created },
                { label: 'Skipped',  value: result.skipped },
                { label: 'Returned', value: (result.purls || []).length },
              ].map((s) => (
                <div
                  key={s.label}
                  className="py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-2xl font-heading font-bold text-white">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── PURL List Tab ──────────────────────────────────────────────
const PurlListTab = ({ links }) => {
  const [purls, setPurls]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterLink, setFilterLink] = useState('');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const perPage = 50;

  const fetchPurls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.purl.getList(filterLink || null, page);
      setPurls(res.purls || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load PURLs');
    } finally {
      setLoading(false);
    }
  }, [filterLink, page]);

  useEffect(() => { fetchPurls(); }, [fetchPurls]);

  const deletePurl = async (id) => {
    if (!window.confirm('Delete this PURL?')) return;
    try {
      await api.purl.delete(id);
      setPurls((p) => p.filter((x) => x.id !== id));
      toast.success('PURL deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const resp = await api.purl.export(filterLink || null);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'purls.csv'; a.click();
      toast.success('PURLs exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const filtered = purls.filter(
    (p) =>
      !search ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  // derive stats from loaded purls
  const uniqueEmails = new Set(purls.map((p) => p.email).filter(Boolean)).size;
  const totalClicks  = purls.reduce((sum, p) => sum + (p.click_count || 0), 0);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Total PURLs',    value: total,        icon: Users,   color: 'text-blue-400',    index: 0 },
          { title: 'Unique Emails',  value: uniqueEmails, icon: Mail,    color: 'text-purple-400',  index: 1 },
          { title: 'Total Clicks',   value: totalClicks,  icon: BarChart3, color: 'text-emerald-400', index: 2 },
        ].map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Controls */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.21 }}
        className="p-4 flex flex-col md:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by email or name…"
            className="enterprise-input w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
        <select
          className="enterprise-input w-full md:w-48"
          value={filterLink}
          onChange={(e) => { setFilterLink(e.target.value); setPage(1); }}
        >
          <option value="">All Links</option>
          {links.map((l) => (
            <option key={l.id} value={l.id}>
              {l.campaign_name || l.campaignName || `Link #${l.id}`}
            </option>
          ))}
        </select>
        <button onClick={handleExport} className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button
          onClick={fetchPurls}
          className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Table */}
      <motion.div
        style={glassCard}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
        className="overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="enterprise-table min-w-[700px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tracking URL</th>
                <th className="text-center">Clicked</th>
                <th className="text-center">Clicks</th>
                <th className="text-center">Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-14">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-9 h-9">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading PURLs…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-14">
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No PURLs found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-sm">{p.name || '—'}</td>
                    <td className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.email}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-xs truncate max-w-[180px]"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                          title={p.purl}
                        >
                          {p.purl}
                        </span>
                        <button
                          onClick={async () => { await navigator.clipboard.writeText(p.purl); toast.success('Copied!'); }}
                          className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      {p.clicked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No</span>
                      )}
                    </td>
                    <td className="text-center text-sm font-bold text-white">{p.click_count}</td>
                    <td className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deletePurl(p.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > perPage && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
          >
            <p>Showing {filtered.length} of {total}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={filtered.length < perPage}
                className="border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:border-white/20 bg-transparent px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ── Email Intelligence Tab (kept intact from original) ─────────
const EmailIntelTab = () => {
  const [data, setData]           = useState(null);
  const [clients, setClients]     = useState([]);
  const [latency, setLatency]     = useState(null);
  const [honeypot, setHoneypot]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [intel, clientData, latencyData, hpData] = await Promise.all([
          api.analytics.getEmailIntelligence(),
          api.analytics.getEmailClients(),
          api.analytics.getClickLatency(),
          api.analytics.getHoneypotStats(),
        ]);
        setData(intel);
        setClients(clientData.clients || []);
        setLatency(latencyData);
        setHoneypot(hpData);
      } catch {
        toast.error('Failed to load email intelligence data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading email intelligence…</p>
      </div>
    );
  }

  const CLIENT_COLORS = {
    Gmail: 'bg-[#ea4335]', Outlook: 'bg-[#0078d4]',
    'Apple Mail': 'bg-[#555]', 'Yahoo Mail': 'bg-[#720e9e]', default: 'bg-[#3b82f6]',
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total PURLs',       value: data?.purl_stats?.total || 0,   icon: Users,       color: 'text-blue-400',    index: 0 },
          { title: 'Clicked PURLs',     value: data?.purl_stats?.clicked || 0, sub: `${data?.purl_stats?.open_rate || 0}% open rate`, icon: CheckCircle2, color: 'text-emerald-400', index: 1 },
          { title: 'Bot Events',        value: data?.honeypot?.bot_count || 0, sub: `${data?.honeypot?.bot_rate || 0}% of traffic`, icon: Shield, color: 'text-red-400', index: 2 },
          { title: 'Avg Click Latency', value: latency?.avg_latency_display || '—', sub: 'send → first click', icon: Clock, color: 'text-amber-400', index: 3 },
        ].map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Email Client Detection */}
        <motion.div style={glassCard} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" /> Email Client Detection
          </h3>
          {clients.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>No email open events yet</p>
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <div key={c.client}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{c.client}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.count} opens ({c.percentage}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className={`h-full rounded-full transition-all ${CLIENT_COLORS[c.client] || CLIENT_COLORS.default}`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Honeypot Detection */}
        <motion.div style={glassCard} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" /> Honeypot Detection
          </h3>
          {!honeypot || honeypot.total === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>No events recorded yet</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total', value: honeypot.total, color: 'text-white' },
                  { label: 'Human', value: honeypot.human_count, color: 'text-emerald-400' },
                  { label: 'Bot',   value: honeypot.bot_count,   color: 'text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="bg-emerald-500 h-full" style={{ width: `${100 - (honeypot.bot_rate || 0)}%` }} />
                <div className="bg-red-500 h-full"     style={{ width: `${honeypot.bot_rate || 0}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>Human ({(100 - (honeypot.bot_rate || 0)).toFixed(1)}%)</span>
                <span>Bot ({honeypot.bot_rate || 0}%)</span>
              </div>

              {honeypot.events?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Events</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {honeypot.events.slice(0, 10).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className={`font-semibold ${e.is_bot ? 'text-red-400' : 'text-emerald-400'}`}>
                          {e.is_bot ? '🤖 Bot' : '👤 Human'}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{e.ip_address}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{e.country || '—'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{e.device_type || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Click Latency */}
      {latency && latency.items?.length > 0 && (
        <motion.div style={glassCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Click Latency (Send → First Click)
          </h3>
          <div className="overflow-x-auto">
            <table className="enterprise-table min-w-[500px] text-sm">
              <thead><tr><th>Recipient</th><th>Email</th><th className="text-center">Latency</th><th className="text-center">Clicked At</th></tr></thead>
              <tbody>
                {latency.items.slice(0, 20).map((item, i) => (
                  <tr key={i}>
                    <td className="font-medium">{item.name || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.5)' }}>{item.email}</td>
                    <td className="text-center font-mono font-bold text-amber-400">{item.latency_display}</td>
                    <td className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {item.clicked_at ? new Date(item.clicked_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Recent Captures */}
      {data?.recent_captures?.length > 0 && (
        <motion.div style={glassCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49 }} className="p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" /> Recent Email Captures
          </h3>
          <div className="overflow-x-auto">
            <table className="enterprise-table min-w-[500px] text-sm">
              <thead><tr><th>Email</th><th>Country</th><th>Browser</th><th className="text-center">Timestamp</th></tr></thead>
              <tbody>
                {data.recent_captures.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.email}</td>
                    <td style={{ color: 'rgba(255,255,255,0.5)' }}>{c.country || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.5)' }}>{c.browser || '—'}</td>
                    <td className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {c.timestamp ? new Date(c.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
const PurlEngine = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [links, setLinks]         = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.links.getAll()
      .then((res) => setLinks(res.links || res || []))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'generate', label: 'PURL Generator',      icon: Zap       },
    { id: 'list',     label: 'PURL List',            icon: Users     },
    { id: 'intel',    label: 'Email Intelligence',   icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-heading text-white">PURL &amp; Email Intel</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Generate personalized URLs, detect email clients, and analyze click behavior
          </p>
        </div>
      </div>

      {/* ── Glass pill tab system ── */}
      <div
        className="inline-flex items-center gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: activeTab === tab.id ? '#93c5fd' : 'rgba(255,255,255,0.45)',
              border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <PurlGeneratorTab links={links} onGenerated={() => setRefreshKey((k) => k + 1)} />
          </motion.div>
        )}
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <PurlListTab key={refreshKey} links={links} />
          </motion.div>
        )}
        {activeTab === 'intel' && (
          <motion.div
            key="intel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <EmailIntelTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurlEngine;
