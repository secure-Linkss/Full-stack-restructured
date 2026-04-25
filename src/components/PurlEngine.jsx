import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Upload, Download, RefreshCw, Trash2, Mail, Link as LinkIcon,
  CheckCircle2, AlertCircle, Clock, BarChart3, Shield, Eye, Plus,
  X, Search, Zap, Globe,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="enterprise-card p-5 flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-heading text-foreground mt-1 tabular-nums-custom">{value}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
    <div className={`p-3 rounded-xl bg-[rgba(255,255,255,0.03)] ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// ─── PURL Generator Tab ───────────────────────────────────────
const PurlGeneratorTab = ({ links, onGenerated }) => {
  const fileInputRef = useRef(null);
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    return lines.slice(1, 6).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
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
    } catch (e) {
      toast.error('PURL generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-1">Generate Personalized URLs</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Upload a CSV with <code className="bg-white/5 px-1 rounded">email</code> and optional <code className="bg-white/5 px-1 rounded">name</code> columns. A unique tracking link is generated per recipient.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Select Tracking Link</label>
            <select className="enterprise-input w-full" value={selectedLinkId} onChange={e => setSelectedLinkId(e.target.value)}>
              <option value="">— Choose a link —</option>
              {links.map(l => (
                <option key={l.id} value={l.id}>
                  {l.campaign_name || l.campaignName || `Link #${l.id}`}
                </option>
              ))}
            </select>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-[#3b82f6]/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">{csvFile ? csvFile.name : 'Click to upload CSV'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Required: <code className="bg-white/5 px-1 rounded">email</code> — Optional: <code className="bg-white/5 px-1 rounded">name</code>
            </p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Preview</p>
              <div className="overflow-x-auto enterprise-card">
                <table className="enterprise-table text-xs min-w-full">
                  <thead><tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{v}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={generate} disabled={!csvFile || !selectedLinkId || generating} className="btn-primary w-full">
            {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {generating ? 'Generating…' : 'Generate PURLs'}
          </button>

          {result && result.success && (
            <div className="enterprise-card p-4 border border-[#10b981]/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                <span className="text-sm font-semibold text-[#10b981]">Generation Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-2xl font-heading font-bold text-foreground">{result.created}</p><p className="text-xs text-muted-foreground">Created</p></div>
                <div><p className="text-2xl font-heading font-bold text-foreground">{result.skipped}</p><p className="text-xs text-muted-foreground">Skipped</p></div>
                <div><p className="text-2xl font-heading font-bold text-foreground">{(result.purls || []).length}</p><p className="text-xs text-muted-foreground">Returned</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── PURL List Tab ────────────────────────────────────────────
const PurlListTab = ({ links }) => {
  const [purls, setPurls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLink, setFilterLink] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;

  const fetchPurls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.purl.getList(filterLink || null, page);
      setPurls(res.purls || []);
      setTotal(res.total || 0);
    } catch (e) {
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
      setPurls(p => p.filter(x => x.id !== id));
      toast.success('PURL deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const resp = await api.purl.export(filterLink || null);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'purls.csv'; a.click();
      toast.success('PURLs exported');
    } catch { toast.error('Export failed'); }
  };

  const filtered = purls.filter(p =>
    !search || p.email?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="enterprise-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input type="text" placeholder="Search by email or name..." className="enterprise-input pl-10 w-full" value={search} onChange={e => setSearch(e.target.value)} />
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
        <select className="enterprise-input w-full md:w-48" value={filterLink} onChange={e => { setFilterLink(e.target.value); setPage(1); }}>
          <option value="">All Links</option>
          {links.map(l => <option key={l.id} value={l.id}>{l.campaign_name || l.campaignName || `Link #${l.id}`}</option>)}
        </select>
        <button onClick={handleExport} className="btn-secondary text-sm shrink-0">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
        <button onClick={fetchPurls} className="btn-secondary px-3 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table min-w-[700px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Personalized URL</th>
                <th className="text-center">Clicked</th>
                <th className="text-center">Count</th>
                <th className="text-center">Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10">
                  <div className="w-6 h-6 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-muted-foreground text-sm">No PURLs found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-sm">{p.name || '—'}</td>
                  <td className="text-sm text-muted-foreground">{p.email}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px]" title={p.purl}>{p.purl}</span>
                      <button onClick={async () => { await navigator.clipboard.writeText(p.purl); toast.success('Copied!'); }} className="p-1 hover:text-foreground text-muted-foreground">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </td>
                  <td className="text-center">
                    {p.clicked
                      ? <span className="inline-flex items-center gap-1 text-xs text-[#10b981]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                  <td className="text-center text-sm font-bold text-foreground">{p.click_count}</td>
                  <td className="text-center text-xs text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td className="text-right">
                    <button onClick={() => deletePurl(p.id)} className="p-1.5 text-muted-foreground hover:text-[#ef4444] rounded-md hover:bg-[rgba(239,68,68,0.1)]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > perPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {filtered.length} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < perPage} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Email Intelligence Tab ───────────────────────────────────
const EmailIntelTab = () => {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [latency, setLatency] = useState(null);
  const [honeypot, setHoneypot] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (e) {
        toast.error('Failed to load email intelligence data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin" />
    </div>
  );

  const CLIENT_COLORS = {
    'Gmail': 'bg-[#ea4335]',
    'Outlook': 'bg-[#0078d4]',
    'Apple Mail': 'bg-[#555]',
    'Yahoo Mail': 'bg-[#720e9e]',
    default: 'bg-[#3b82f6]',
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total PURLs" value={data?.purl_stats?.total || 0} icon={Users} color="text-[#3b82f6]" />
        <StatCard title="Clicked PURLs" value={data?.purl_stats?.clicked || 0} sub={`${data?.purl_stats?.open_rate || 0}% open rate`} icon={CheckCircle2} color="text-[#10b981]" />
        <StatCard title="Bot Events" value={data?.honeypot?.bot_count || 0} sub={`${data?.honeypot?.bot_rate || 0}% of traffic`} icon={Shield} color="text-[#ef4444]" />
        <StatCard title="Avg Click Latency" value={latency?.avg_latency_display || '—'} sub="send → first click" icon={Clock} color="text-[#f59e0b]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Client Detection */}
        <div className="enterprise-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#3b82f6]" /> Email Client Detection
          </h3>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No email open events yet</p>
          ) : (
            <div className="space-y-3">
              {clients.map(c => (
                <div key={c.client}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{c.client}</span>
                    <span className="text-xs text-muted-foreground">{c.count} opens ({c.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${CLIENT_COLORS[c.client] || CLIENT_COLORS.default}`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Honeypot Detection */}
        <div className="enterprise-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#ef4444]" /> Honeypot Detection
          </h3>
          {!honeypot || honeypot.total === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events recorded yet</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="enterprise-card p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-foreground">{honeypot.total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Events</p>
                </div>
                <div className="enterprise-card p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-[#10b981]">{honeypot.human_count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Human</p>
                </div>
                <div className="enterprise-card p-3 text-center">
                  <p className="text-2xl font-heading font-bold text-[#ef4444]">{honeypot.bot_count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bot</p>
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-[#10b981] h-full transition-all" style={{ width: `${100 - (honeypot.bot_rate || 0)}%` }} />
                <div className="bg-[#ef4444] h-full transition-all" style={{ width: `${honeypot.bot_rate || 0}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Human ({(100 - (honeypot.bot_rate || 0)).toFixed(1)}%)</span>
                <span>Bot ({honeypot.bot_rate || 0}%)</span>
              </div>

              {/* Recent events */}
              {honeypot.events?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Recent Events</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {honeypot.events.slice(0, 10).map(e => (
                      <div key={e.id} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-background border border-border">
                        <span className={`font-semibold ${e.is_bot ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                          {e.is_bot ? '🤖 Bot' : '👤 Human'}
                        </span>
                        <span className="text-muted-foreground">{e.ip_address}</span>
                        <span className="text-muted-foreground">{e.country || '—'}</span>
                        <span className="text-muted-foreground">{e.device_type || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Click Latency */}
      {latency && latency.items?.length > 0 && (
        <div className="enterprise-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f59e0b]" /> Click Latency (Send → First Click)
          </h3>
          <div className="overflow-x-auto">
            <table className="enterprise-table min-w-[500px] text-sm">
              <thead><tr><th>Recipient</th><th>Email</th><th className="text-center">Latency</th><th className="text-center">Clicked At</th></tr></thead>
              <tbody>
                {latency.items.slice(0, 20).map((item, i) => (
                  <tr key={i}>
                    <td className="font-medium">{item.name || '—'}</td>
                    <td className="text-muted-foreground">{item.email}</td>
                    <td className="text-center font-mono font-bold text-[#f59e0b]">{item.latency_display}</td>
                    <td className="text-center text-muted-foreground text-xs">{item.clicked_at ? new Date(item.clicked_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Captures */}
      {data?.recent_captures?.length > 0 && (
        <div className="enterprise-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#10b981]" /> Recent Email Captures
          </h3>
          <div className="overflow-x-auto">
            <table className="enterprise-table min-w-[500px] text-sm">
              <thead><tr><th>Email</th><th>Country</th><th>Browser</th><th className="text-center">Timestamp</th></tr></thead>
              <tbody>
                {data.recent_captures.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.email}</td>
                    <td className="text-muted-foreground">{c.country || '—'}</td>
                    <td className="text-muted-foreground">{c.browser || '—'}</td>
                    <td className="text-center text-xs text-muted-foreground">{c.timestamp ? new Date(c.timestamp).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────
const PurlEngine = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [links, setLinks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.links.getAll()
      .then(res => setLinks(res.links || res || []))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'generate', label: 'Generate PURLs', icon: Zap },
    { id: 'list',     label: 'PURL Mapping',   icon: Users },
    { id: 'intel',    label: 'Email Intelligence', icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-foreground">PURL Engine & Email Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate personalized URLs, detect email clients, and analyze click behavior</p>
      </div>

      {/* Tabs */}
      <div className="enterprise-card p-1 inline-flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#3b82f6] text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <PurlGeneratorTab links={links} onGenerated={() => setRefreshKey(k => k + 1)} />
      )}
      {activeTab === 'list' && (
        <PurlListTab key={refreshKey} links={links} />
      )}
      {activeTab === 'intel' && (
        <EmailIntelTab />
      )}
    </div>
  );
};

export default PurlEngine;
