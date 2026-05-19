import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, Edit, ExternalLink, Link as LinkIcon, Mail, Image, MousePointer2, Users, Shield, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const glass = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const EnhancedLinkBox = ({ link, onRegenerate, onEdit, onDelete, onLinkUpdate, isShortener = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState(link.targetUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const trackingUrl = link.trackingUrl || 'N/A';
  const pixelUrl = link.pixelUrl || 'N/A';
  const emailCode = link.emailCode || 'N/A';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const testLink = () => {
    if (trackingUrl !== 'N/A') window.open(trackingUrl, '_blank');
    else toast.error('Tracking URL is not available.');
  };

  const handleEditToggle = () => {
    if (isEditing) setLandingPageUrl(link.targetUrl);
    setIsEditing(!isEditing);
  };

  const handleSaveLandingPage = async () => {
    setIsSaving(true);
    try {
      await api.links.updateTargetUrl(link.id, landingPageUrl);
      toast.success('Landing page URL updated!');
      onLinkUpdate({ ...link, targetUrl: landingPageUrl });
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update landing page URL.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusColors = {
    active: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
    paused: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    inactive: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  };
  const sc = statusColors[link.status] || statusColors.active;

  const renderLinkSection = (title, value, copyKey, isEditable = false) => (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</p>
      <div className="flex items-center gap-2">
        {isEditable && isEditing ? (
          <input
            value={landingPageUrl}
            onChange={(e) => setLandingPageUrl(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono text-white outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.4)' }}
          />
        ) : (
          <code
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono break-all"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', color: '#60a5fa' }}
          >
            {value}
          </code>
        )}
        <button
          onClick={() => copyToClipboard(value, copyKey)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: copiedKey === copyKey ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {copiedKey === copyKey
            ? <Check className="w-3.5 h-3.5 text-emerald-400" />
            : <Copy className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          }
        </button>
      </div>
      {isEditable && isEditing && (
        <div className="flex justify-end gap-2 mt-1.5">
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={handleSaveLandingPage}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)' }}
          >
            {isSaving ? 'Saving…' : <><Check className="w-3 h-3" /> Save</>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={glass}
      className="overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <LinkIcon className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">{link.campaignName}</p>
          <span
            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {link.status || 'active'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={testLink}
            title="Test Link"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <button
            onClick={() => onRegenerate(link)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}
          >
            <Edit className="w-3 h-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => onDelete(link)}
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        {renderLinkSection('Target URL', landingPageUrl, 'target', true)}
        {renderLinkSection('Tracking URL', trackingUrl, 'tracking')}
        {!isShortener && renderLinkSection('Pixel URL', pixelUrl, 'pixel')}
        {!isShortener && renderLinkSection('Email Code', emailCode, 'email')}
      </div>

      {/* Footer stats */}
      <div
        className="px-5 py-3 flex justify-between items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
      >
        {[
          { icon: MousePointer2, value: link.totalClicks || 0, label: 'clicks', color: '#60a5fa' },
          { icon: Users, value: link.realVisitors || 0, label: 'visitors', color: '#34d399' },
          { icon: Shield, value: link.botsBlocked || 0, label: 'bots blocked', color: '#a78bfa' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xs font-semibold text-white">{value.toLocaleString()}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default EnhancedLinkBox;
