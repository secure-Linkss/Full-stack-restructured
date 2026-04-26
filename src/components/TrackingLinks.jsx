import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Link as LinkIcon, Copy, RefreshCw, Trash2, Edit, Code, Globe,
  Shield, Activity, BarChart3, Users, QrCode, X, Search, CheckCircle2,
  Download, Upload, Heart, AlertTriangle, AlertCircle, Eye, EyeOff,
  Settings2, Image, Share2, MoreHorizontal, FileText, Zap, Filter,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import CreateLinkForm from './forms/CreateLink';
import GeneratedLinkCardModal from './GeneratedLinkCardModal';
import InboxScoreBadge from './ui/InboxScoreBadge';

// ─── Helpers ──────────────────────────────────────────────────
const g = (obj, ...keys) => { for (const k of keys) if (obj[k] != null) return obj[k]; return ''; };

const HEALTH_COLORS = {
  active:  'text-[#10b981] bg-[rgba(16,185,129,0.1)]',
  warning: 'text-[#f59e0b] bg-[rgba(245,158,11,0.1)]',
  down:    'text-[#ef4444] bg-[rgba(239,68,68,0.1)]',
  unknown: 'text-muted-foreground bg-white/5',
};
const HEALTH_ICONS = {
  active:  <CheckCircle2 className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  down:    <AlertCircle className="w-3 h-3" />,
  unknown: <Activity className="w-3 h-3" />,
};

// ─── QR Modal ────────────────────────────────────────────────
const QRModal = ({ link, onClose }) => {
  const [format, setFormat] = useState('png');
  const [size, setSize] = useState(300);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.links.getQR(link.id, format, size);
      if (!resp.ok) throw new Error('Failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setQrDataUrl(url);
    } catch (e) {
      toast.error('QR generation failed');
    } finally {
      setLoading(false);
    }
  }, [link.id, format, size]);

  useEffect(() => { generate(); }, [generate]);

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr_${link.short_code}.${format}`;
    a.click();
    toast.success(`QR downloaded as ${format.toUpperCase()}`);
  };

  const copyUrl = async () => {
    const url = g(link, 'trackingUrl', 'tracking_url');
    await navigator.clipboard.writeText(url);
    toast.success('Tracking URL copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-sm mx-4 p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#3b82f6]" /> QR Code Generator
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center justify-center bg-white rounded-xl p-4 min-h-[200px] mb-4">
          {loading ? (
            <div className="w-8 h-8 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin" />
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="max-w-[240px] max-h-[240px]" />
          ) : (
            <p className="text-sm text-gray-400">No QR generated</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Format</label>
            <select className="enterprise-input w-full" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Size (px)</label>
            <select className="enterprise-input w-full" value={size} onChange={e => setSize(Number(e.target.value))}>
              <option value={200}>200</option>
              <option value={300}>300</option>
              <option value={500}>500</option>
              <option value={800}>800</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={generate} className="btn-secondary flex-1 text-sm" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Regenerate
          </button>
          <button onClick={download} className="btn-primary flex-1 text-sm" disabled={!qrDataUrl}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download
          </button>
          <button onClick={copyUrl} className="btn-secondary px-3 text-sm" title="Copy tracking URL">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Health Monitor Modal ─────────────────────────────────────
const HealthModal = ({ link, onClose }) => {
  const [data, setData] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.links.getHealth(link.id).then(setData).catch(() => toast.error('Failed to load health data'));
  }, [link.id]);

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await api.links.checkHealth(link.id);
      setData(prev => ({
        ...prev,
        health_status: res.health_status,
        health_response_code: res.response_code,
        health_last_checked: res.checked_at,
        logs: [res, ...(prev?.logs || [])].slice(0, 10),
      }));
      toast.success(`Health check: ${res.health_status}`);
    } catch (e) {
      toast.error('Health check failed');
    } finally {
      setChecking(false);
    }
  };

  const status = data?.health_status || 'unknown';
  const colorClass = HEALTH_COLORS[status] || HEALTH_COLORS.unknown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-md mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#10b981]" /> Link Health Monitor
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="enterprise-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${colorClass}`}>
                {HEALTH_ICONS[status]} {status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Response Code</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {data?.health_response_code || '—'}
              </p>
            </div>
          </div>
          {data?.health_last_checked && (
            <p className="text-xs text-muted-foreground mt-2">
              Last checked: {new Date(data.health_last_checked).toLocaleString()}
            </p>
          )}
        </div>

        <button onClick={runCheck} disabled={checking} className="btn-primary w-full mb-4 text-sm">
          {checking ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {checking ? 'Checking…' : 'Run Health Check Now'}
        </button>

        {data?.logs?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Recent Logs</p>
            <div className="space-y-2">
              {data.logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${HEALTH_COLORS[log.status] || ''}`}>
                    {HEALTH_ICONS[log.status]} {log.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{log.response_code || '—'}</span>
                  <span className="text-xs text-muted-foreground">{log.response_time_ms ? `${log.response_time_ms}ms` : '—'}</span>
                  <span className="text-xs text-muted-foreground">{log.checked_at ? new Date(log.checked_at).toLocaleTimeString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Pixel Injection Modal ────────────────────────────────────
const PixelModal = ({ link, onClose }) => {
  const [pixels, setPixels] = useState({
    facebook_pixel_id: '', enable_facebook_pixel: false,
    google_ads_pixel: '', enable_google_ads_pixel: false,
    tiktok_pixel: '', enable_tiktok_pixel: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.links.getPixels(link.id)
      .then(d => setPixels(d.pixels || {}))
      .catch(() => toast.error('Failed to load pixel config'));
  }, [link.id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.links.updatePixels(link.id, pixels);
      toast.success('Pixel configuration saved');
      onClose();
    } catch (e) {
      toast.error('Failed to save pixels');
    } finally {
      setSaving(false);
    }
  };

  const PixelRow = ({ label, idKey, enableKey, placeholder }) => (
    <div className="enterprise-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-muted-foreground">{pixels[enableKey] ? 'Enabled' : 'Disabled'}</span>
          <div
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${pixels[enableKey] ? 'bg-[#3b82f6]' : 'bg-white/10'}`}
            onClick={() => setPixels(p => ({ ...p, [enableKey]: !p[enableKey] }))}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${pixels[enableKey] ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
      <input
        type="text"
        className="enterprise-input w-full"
        placeholder={placeholder}
        value={pixels[idKey] || ''}
        onChange={e => setPixels(p => ({ ...p, [idKey]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-md mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#f59e0b]" /> Retargeting Pixels
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3 mb-5">
          <PixelRow label="Facebook Pixel" idKey="facebook_pixel_id" enableKey="enable_facebook_pixel" placeholder="Enter Facebook Pixel ID" />
          <PixelRow label="Google Ads" idKey="google_ads_pixel" enableKey="enable_google_ads_pixel" placeholder="Enter Google Ads conversion ID" />
          <PixelRow label="TikTok Pixel" idKey="tiktok_pixel" enableKey="enable_tiktok_pixel" placeholder="Enter TikTok Pixel ID" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Pixels
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── OG Metadata Modal ────────────────────────────────────────
const OGModal = ({ link, onClose }) => {
  const [og, setOg] = useState({ og_title: '', og_description: '', og_image_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.links.getOgMetadata(link.id)
      .then(d => setOg(d.og_metadata || {}))
      .catch(() => toast.error('Failed to load OG metadata'));
  }, [link.id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.links.updateOgMetadata(link.id, og);
      toast.success('OG metadata saved');
      onClose();
    } catch (e) {
      toast.error('Failed to save OG metadata');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-md mx-4 p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#3b82f6]" /> Open Graph Control
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Preview card */}
        <div className="bg-background border border-border rounded-xl overflow-hidden mb-5">
          {og.og_image_url && (
            <img src={og.og_image_url} alt="OG Preview" className="w-full h-32 object-cover" onError={e => { e.target.style.display = 'none'; }} />
          )}
          {!og.og_image_url && (
            <div className="w-full h-32 bg-white/5 flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
          <div className="p-3">
            <p className="text-sm font-semibold text-foreground truncate">{og.og_title || 'Page Title'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{og.og_description || 'Page description will appear here...'}</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">og:title</label>
            <input className="enterprise-input w-full" placeholder="Social share title" value={og.og_title || ''} onChange={e => setOg(p => ({ ...p, og_title: e.target.value }))} maxLength={255} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">og:description</label>
            <textarea className="enterprise-input w-full resize-none" rows={3} placeholder="Social share description" value={og.og_description || ''} onChange={e => setOg(p => ({ ...p, og_description: e.target.value }))} maxLength={500} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">og:image URL</label>
            <input className="enterprise-input w-full" placeholder="https://..." value={og.og_image_url || ''} onChange={e => setOg(p => ({ ...p, og_image_url: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save OG Data
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Routing Rules Modal ──────────────────────────────────────
const RULE_TYPES = [
  { value: 'device', label: 'Device Type' },
  { value: 'geo', label: 'Geo Location' },
  { value: 'returning_visitor', label: 'Returning Visitor' },
  { value: 'time_of_day', label: 'Time of Day' },
];

const RoutingModal = ({ link, onClose }) => {
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.links.getRoutingRules(link.id)
      .then(d => setRules(d.routing_rules || []))
      .catch(() => toast.error('Failed to load routing rules'));
  }, [link.id]);

  const addRule = () => setRules(r => [...r, { type: 'device', condition: '', destination_url: '' }]);
  const removeRule = (i) => setRules(r => r.filter((_, idx) => idx !== i));
  const updateRule = (i, key, val) => setRules(r => r.map((rule, idx) => idx === i ? { ...rule, [key]: val } : rule));

  const save = async () => {
    const invalid = rules.some(r => !r.destination_url || !r.destination_url.startsWith('http'));
    if (invalid) { toast.error('All rules need a valid destination URL (must start with http)'); return; }
    setSaving(true);
    try {
      await api.links.updateRoutingRules(link.id, rules);
      toast.success('Routing rules saved');
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-lg mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#10b981]" /> Dynamic Routing Rules
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">Rules are evaluated top-to-bottom. First match wins. Non-matching traffic goes to the default target URL.</p>

        {rules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No rules yet. Add one below.</div>
        )}

        <div className="space-y-3 mb-4">
          {rules.map((rule, i) => (
            <div key={i} className="enterprise-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Rule #{i + 1}</span>
                <button onClick={() => removeRule(i)} className="p-1 text-muted-foreground hover:text-[#ef4444]"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Trigger</label>
                  <select className="enterprise-input w-full mt-1" value={rule.type} onChange={e => updateRule(i, 'type', e.target.value)}>
                    {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Condition / Value</label>
                  <input className="enterprise-input w-full mt-1" placeholder={
                    rule.type === 'device' ? 'mobile, desktop, tablet' :
                    rule.type === 'geo' ? 'US, GB, CA...' :
                    rule.type === 'returning_visitor' ? 'true' : 'e.g. 09:00-17:00'
                  } value={rule.condition || ''} onChange={e => updateRule(i, 'condition', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Destination URL</label>
                <input className="enterprise-input w-full mt-1" placeholder="https://destination.com" value={rule.destination_url || ''} onChange={e => updateRule(i, 'destination_url', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={addRule} className="btn-secondary w-full text-sm mb-4">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Rule
        </button>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bulk Import Modal ────────────────────────────────────────
const BulkImportModal = ({ onClose, onImported }) => {
  const fileInputRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    return lines.slice(1, 11).map(line => {
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

  const doImport = async () => {
    if (!csvFile) { toast.error('Please select a CSV file'); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const result = await api.links.bulkImportCSV(formData);
      if (result.success) {
        toast.success(`Imported ${result.created} links${result.errors > 0 ? `, ${result.errors} errors` : ''}`);
        onImported();
        onClose();
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (e) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="enterprise-card w-full max-w-lg mx-4 p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#3b82f6]" /> Bulk Import Links
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-[#3b82f6]/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">{csvFile ? csvFile.name : 'Click to upload CSV'}</p>
          <p className="text-xs text-muted-foreground mt-1">Required columns: <code className="bg-white/5 px-1 rounded">target_url</code> — Optional: <code className="bg-white/5 px-1 rounded">campaign_name</code></p>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
        </div>

        {preview.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Preview (first {preview.length} rows)</p>
            <div className="overflow-x-auto enterprise-card">
              <table className="enterprise-table text-xs min-w-full">
                <thead>
                  <tr>{Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="truncate max-w-[120px]">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={doImport} disabled={!csvFile || importing} className="btn-primary flex-1">
            {importing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {importing ? 'Importing…' : 'Import Links'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────
const TrackingLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({ totalClicks: 0, realVisitors: 0, botsBlocked: 0 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [recentlyCreatedLink, setRecentlyCreatedLink] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Feature modals
  const [qrLink, setQrLink] = useState(null);
  const [healthLink, setHealthLink] = useState(null);
  const [pixelLink, setPixelLink] = useState(null);
  const [ogLink, setOgLink] = useState(null);
  const [routingLink, setRoutingLink] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.links.getAll();
      const linksData = response.links || response || [];
      const arr = Array.isArray(linksData) ? linksData : [];
      setLinks(arr);

      const totalClicks = arr.reduce((sum, l) => sum + (l.totalClicks || l.total_clicks || 0), 0);
      const realVisitors = arr.reduce((sum, l) => sum + (l.realVisitors || l.real_visitors || 0), 0);
      const botsBlocked = arr.reduce((sum, l) => sum + (l.botsBlocked || l.blocked_attempts || 0), 0);
      setMetrics({ totalClicks, realVisitors, botsBlocked });
    } catch (error) {
      toast.error('Failed to load tracking links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (action, link) => {
    if (action === 'Copy Link') {
      const url = g(link, 'trackingUrl', 'tracking_url', 'short_url');
      await navigator.clipboard.writeText(url);
      toast.success('Tracking Link Copied!');
    } else if (action === 'Copy Pixel') {
      const url = g(link, 'pixelUrl', 'pixel_url');
      await navigator.clipboard.writeText(url);
      toast.success('Pixel URL Copied!');
    } else if (action === 'Edit') {
      setEditingLink(link); setShowFormModal(true);
    } else if (action === 'QR') {
      setQrLink(link);
    } else if (action === 'Health') {
      setHealthLink(link);
    } else if (action === 'Pixels') {
      setPixelLink(link);
    } else if (action === 'OG') {
      setOgLink(link);
    } else if (action === 'Routing') {
      setRoutingLink(link);
    } else if (action === 'Regenerate') {
      if (window.confirm(`Regenerate tracking code for "${g(link, 'campaignName', 'campaign_name') || 'this link'}"?`)) {
        try {
          const response = await api.links.regenerate(link.id);
          setLinks(prev => prev.map(l => l.id === link.id ? { ...l, ...response } : l));
          setRecentlyCreatedLink(response.link || response);
          toast.success('Link regenerated!');
        } catch (error) {
          toast.error(`Regeneration failed: ${error.message}`);
        }
      }
    } else if (action === 'Delete') {
      if (window.confirm(`Delete "${g(link, 'campaignName', 'campaign_name') || 'this link'}" permanently?`)) {
        try {
          await api.links.delete(link.id);
          setLinks(prev => prev.filter(l => l.id !== link.id));
          toast.success('Deleted successfully.');
        } catch (error) {
          toast.error(`Deletion failed: ${error.message}`);
        }
      }
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const resp = await api.links.exportAll();
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tracking_links.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Links exported as CSV');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredLinks = links.filter(link => {
    const status = link.status || 'active';
    const matchesFilter = filter === 'all' || status === filter;
    const name = g(link, 'campaignName', 'campaign_name').toLowerCase();
    const url = g(link, 'targetUrl', 'original_url', 'target_url').toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || url.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const paginatedLinks = filteredLinks.slice((page - 1) * pageSize, page * pageSize);

  const metricCards = [
    { title: 'Total Tracking Links', value: links.length.toLocaleString(), icon: LinkIcon, color: 'blue' },
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3, color: 'green' },
    { title: 'Real Visitors', value: metrics.realVisitors.toLocaleString(), icon: Users, color: 'green' },
    { title: 'Bots Blocked', value: metrics.botsBlocked.toLocaleString(), icon: Shield, color: 'red' },
  ];

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Tracking Links</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage infrastructure routing and pixels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkImport(true)} className="btn-secondary text-sm" title="Bulk Import CSV">
            <Upload className="w-4 h-4 mr-2" /> Import
          </button>
          <button onClick={handleExport} disabled={exportLoading} className="btn-secondary text-sm" title="Export as CSV">
            {exportLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export
          </button>
          <button className="btn-primary text-sm" onClick={() => { setEditingLink(null); setShowFormModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Create Link Target</span><span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full">
        {metricCards.map((card, index) => (
          <div key={index} className={`enterprise-card p-5 enterprise-stat-card-${card.color} flex justify-between items-center`}>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{card.title}</p>
              <h3 className="text-3xl font-heading text-foreground mt-1.5 tabular-nums-custom">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-[rgba(255,255,255,0.03)] text-${card.color === 'green' ? '[#10b981]' : card.color === 'blue' ? '[#3b82f6]' : '[#ef4444]'}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <input type="text" placeholder="Search by campaign name or target URL..." className="enterprise-input pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="enterprise-input w-full md:w-40 appearance-none" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <button className="btn-secondary px-3" onClick={fetchData} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="enterprise-card overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="enterprise-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-[20%]">Campaign Info</th>
                <th className="w-[22%]">Routing Endpoints</th>
                <th className="w-[10%] text-center">Health</th>
                <th className="w-[18%] text-center">Traffic & Leads</th>
                <th className="w-[10%] text-center">Status</th>
                <th className="w-[20%] text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-muted-foreground">Loading tracking links...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedLinks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <LinkIcon className="w-10 h-10 text-muted-foreground/30 mb-4" />
                      <p className="text-sm font-medium text-muted-foreground">No tracking links found</p>
                      <button onClick={() => { setEditingLink(null); setShowFormModal(true); }} className="btn-primary text-xs mt-4 py-1.5 px-4">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Link
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLinks.map((link) => {
                  const name = g(link, 'campaignName', 'campaign_name') || 'Unnamed Campaign';
                  const targetUrl = g(link, 'targetUrl', 'original_url', 'target_url') || '';
                  const trackingUrl = g(link, 'trackingUrl', 'tracking_url', 'short_url') || '';
                  const pixelUrl = g(link, 'pixelUrl', 'pixel_url') || '';
                  const sendCode = g(link, 'emailCode', 'email_code', 'send_code') || (link.id ? String(link.id).substring(0, 6) : '');
                  const visitors = link.realVisitors || link.real_visitors || 0;
                  const emails = link.capturedEmails || link.captured_emails || 0;
                  const bots = link.botsBlocked || link.blocked_attempts || 0;
                  const status = link.status || 'active';
                  const healthStatus = link.health_status || 'unknown';
                  const hasPixels = link.enable_facebook_pixel || link.enable_google_ads_pixel || link.enable_tiktok_pixel;
                  const hasOG = link.og_title || link.og_description;
                  const hasRules = Array.isArray(link.routing_rules) && link.routing_rules.length > 0;

                  return (
                    <tr key={link.id} className="group">
                      <td className="align-top py-4">
                        <div className="font-semibold text-foreground text-sm flex items-center">
                          <span className="truncate max-w-[160px]">{name}</span>
                          {link.isDefault && <span className="ml-2 badge-dim-green text-[10px]">Primary</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={targetUrl}>
                          {targetUrl || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border flex items-center text-muted-foreground">
                            <Code className="w-3 h-3 mr-1" />{sendCode}
                          </span>
                          {hasPixels && <span className="text-[10px] badge-dim-blue">Pixels</span>}
                          {hasOG && <span className="text-[10px] badge-dim-green">OG</span>}
                          {hasRules && <span className="text-[10px] badge-dim-amber">Rules</span>}
                        </div>
                        {/* ── Inbox Survival Score™ ── */}
                        <InboxScoreBadge linkId={link.id} />
                      </td>

                      <td className="align-top py-4 space-y-2">
                        <div className="flex items-center justify-between bg-background border border-border px-2 py-1.5 rounded text-xs">
                          <div className="flex items-center overflow-hidden mr-2">
                            <LinkIcon className="w-3.5 h-3.5 text-[#3b82f6] mr-1.5 shrink-0" />
                            <span className="font-mono truncate text-muted-foreground" title={trackingUrl}>{trackingUrl || 'Pending...'}</span>
                          </div>
                          <button onClick={() => handleAction('Copy Link', link)} className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Copy tracking link">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-background border border-border px-2 py-1.5 rounded text-xs">
                          <div className="flex items-center overflow-hidden mr-2">
                            <QrCode className="w-3.5 h-3.5 text-[#10b981] mr-1.5 shrink-0" />
                            <span className="font-mono truncate text-muted-foreground" title={pixelUrl}>{pixelUrl || 'Pixel not configured'}</span>
                          </div>
                          <button onClick={() => handleAction('Copy Pixel', link)} className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Copy pixel URL">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="align-top py-4 text-center">
                        <button
                          onClick={() => handleAction('Health', link)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold capitalize transition-opacity hover:opacity-100 ${HEALTH_COLORS[healthStatus]}`}
                          title="View health details"
                        >
                          {HEALTH_ICONS[healthStatus]}
                          {healthStatus}
                        </button>
                      </td>

                      <td className="align-top py-4 text-center">
                        <div className="flex justify-center items-end gap-3">
                          <div className="flex flex-col items-center">
                            <Users className="w-4 h-4 text-[#10b981] mb-1" />
                            <span className="tabular-nums-custom font-bold text-foreground">{visitors}</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Real</span>
                          </div>
                          <div className="w-px h-8 bg-border"></div>
                          <div className="flex flex-col items-center">
                            <svg className="w-4 h-4 text-[#3b82f6] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="tabular-nums-custom font-bold text-foreground">{emails}</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Emails</span>
                          </div>
                          <div className="w-px h-8 bg-border"></div>
                          <div className="flex flex-col items-center">
                            <Shield className="w-4 h-4 text-[#ef4444] mb-1 opacity-80" />
                            <span className="tabular-nums-custom font-bold text-foreground">{bots}</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Bots</span>
                          </div>
                        </div>
                      </td>

                      <td className="align-top py-4 text-center">
                        <span className={`badge-dim-${status === 'active' ? 'green' : status === 'paused' ? 'amber' : 'blue'} mb-2`}>
                          {status}
                        </span>
                      </td>

                      <td className="align-top py-4">
                        <div className="flex justify-end items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleAction('QR', link)} className="p-1.5 rounded-md hover:bg-[rgba(59,130,246,0.1)] text-muted-foreground hover:text-[#3b82f6]" title="QR Code">
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Health', link)} className="p-1.5 rounded-md hover:bg-[rgba(16,185,129,0.1)] text-muted-foreground hover:text-[#10b981]" title="Health Monitor">
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Pixels', link)} className="p-1.5 rounded-md hover:bg-[rgba(245,158,11,0.1)] text-muted-foreground hover:text-[#f59e0b]" title="Pixel Injection">
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('OG', link)} className="p-1.5 rounded-md hover:bg-[rgba(139,92,246,0.1)] text-muted-foreground hover:text-[#8b5cf6]" title="Open Graph">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Routing', link)} className="p-1.5 rounded-md hover:bg-[rgba(16,185,129,0.1)] text-muted-foreground hover:text-[#10b981]" title="Routing Rules">
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Edit', link)} className="p-1.5 rounded-md hover:bg-[rgba(59,130,246,0.1)] text-muted-foreground hover:text-[#3b82f6]" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Regenerate', link)} className="p-1.5 rounded-md hover:bg-[rgba(245,158,11,0.1)] text-muted-foreground hover:text-[#f59e0b]" title="Regenerate">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleAction('Delete', link)} className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-muted-foreground hover:text-[#ef4444]" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filteredLinks.length)} of {filteredLinks.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return pageNum <= totalPages ? (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-3 py-1 text-xs rounded-md transition-colors ${pageNum === page ? 'bg-[#3b82f6] text-white' : 'btn-secondary'}`}>{pageNum}</button>
                ) : null;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Feature Modals */}
      {qrLink && <QRModal link={qrLink} onClose={() => setQrLink(null)} />}
      {healthLink && <HealthModal link={healthLink} onClose={() => setHealthLink(null)} />}
      {pixelLink && <PixelModal link={pixelLink} onClose={() => setPixelLink(null)} />}
      {ogLink && <OGModal link={ogLink} onClose={() => setOgLink(null)} />}
      {routingLink && <RoutingModal link={routingLink} onClose={() => setRoutingLink(null)} />}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={fetchData} />}

      {/* Create/Edit modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFormModal(false)}>
          <div className="enterprise-card w-full max-w-xl mx-4 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground flex items-center">
                <LinkIcon className="w-4 h-4 mr-2 text-[#3b82f6]" />
                {editingLink ? 'Edit Target Vector' : 'Create Advanced Target'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CreateLinkForm
              type="tracking"
              editingLink={editingLink}
              onClose={() => setShowFormModal(false)}
              onLinkCreated={(link) => { fetchData(); setRecentlyCreatedLink(link); }}
            />
          </div>
        </div>
      )}

      {recentlyCreatedLink && (
        <GeneratedLinkCardModal link={recentlyCreatedLink} onClose={() => setRecentlyCreatedLink(null)} />
      )}
    </div>
  );
};

export default TrackingLinks;
