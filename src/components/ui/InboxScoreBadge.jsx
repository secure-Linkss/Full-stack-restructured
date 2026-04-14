/**
 * InboxScoreBadge
 * ================
 * Displays the Inbox Survival Score™ for a single tracking link.
 * Shows score, grade, bot risk, domain reputation, scanner risk,
 * and redirect cleanliness as compact colour-coded badges.
 *
 * Usage:
 *   <InboxScoreBadge linkId={link.id} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Shield, Globe, Activity, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

// ── Colour helpers ────────────────────────────────────────────────────────────

const scoreColor = (score) => {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
};

const scoreBg = (score) => {
  if (score === null || score === undefined) return 'bg-white/5';
  if (score >= 80) return 'bg-emerald-500/10 border border-emerald-500/20';
  if (score >= 50) return 'bg-amber-500/10 border border-amber-500/20';
  return 'bg-red-500/10 border border-red-500/20';
};

const riskColor = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'low')    return 'text-emerald-400';
  if (l === 'medium') return 'text-amber-400';
  if (l === 'high')   return 'text-red-400';
  return 'text-gray-400';
};

const repColor = (rep) => {
  const r = (rep || '').toLowerCase();
  if (r === 'strong') return 'text-emerald-400';
  if (r === 'medium') return 'text-amber-400';
  if (r === 'weak')   return 'text-red-400';
  return 'text-gray-400';
};

// ── Mini pill ─────────────────────────────────────────────────────────────────

const Pill = ({ icon: Icon, label, value, colorClass }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[11px] font-medium text-muted-foreground">
    {Icon && <Icon className={`w-2.5 h-2.5 ${colorClass}`} />}
    <span className="text-gray-400">{label}:</span>
    <span className={colorClass}>{value}</span>
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────

const InboxScoreBadge = ({ linkId, onOptimize }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchScore = useCallback(async () => {
    if (!linkId) return;
    setLoading(true);
    try {
      const data = await api.links.getInboxScore(linkId);
      if (data?.inbox_score !== undefined) {
        setScore(data);
      }
    } catch {
      // silently fail — don't block the UI
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => { fetchScore(); }, [fetchScore]);

  const handleOptimize = async (e) => {
    e.stopPropagation();
    setOptimizing(true);
    try {
      const result = await api.links.optimize(linkId);
      if (result?.upgrade_required) {
        toast.error('Auto-Stealth is a premium feature. Upgrade your plan to unlock it.');
        return;
      }
      if (result?.success) {
        toast.success(`Optimized! Score improved: ${result.score_before} → ${result.score_after}`);
        await fetchScore();
        onOptimize?.(result);
      } else {
        toast.error(result?.error || 'Optimization failed');
      }
    } catch {
      toast.error('Optimization request failed');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Scoring…</span>
      </div>
    );
  }

  if (!score) return null;

  const s = score.inbox_score;
  const grade = score.grade || '?';

  return (
    <div className="mt-2">
      {/* ── Score row ── */}
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-all ${scoreBg(s)}`}
        onClick={() => setExpanded(v => !v)}
        title="Click to see full inbox score breakdown"
      >
        {/* Score dial */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
            <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="16" cy="16" r="12" fill="none"
              stroke={s >= 80 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${(s / 100) * 75.4} 75.4`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-[10px] font-bold leading-none ${scoreColor(s)}`}>{s}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-muted-foreground leading-none">Inbox Score</span>
          <span className={`text-xs font-bold leading-none mt-0.5 ${scoreColor(s)}`}>
            {grade} — {s >= 80 ? 'Excellent' : s >= 50 ? 'Average' : 'Poor'}
          </span>
        </div>

        <Zap className={`w-3.5 h-3.5 ml-1 ${scoreColor(s)}`} />
      </div>

      {/* ── Expanded breakdown ── */}
      {expanded && (
        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap gap-1">
            <Pill icon={Shield}   label="Bot Risk"   value={score.bot_risk || '—'}          colorClass={riskColor(score.bot_risk)} />
            <Pill icon={Globe}    label="Domain"     value={score.domain_reputation || '—'} colorClass={repColor(score.domain_reputation)} />
            <Pill icon={Activity} label="Scanners"   value={score.scanner_risk || '—'}      colorClass={riskColor(score.scanner_risk)} />
            <Pill icon={TrendingUp} label="Redirect" value={`${score.redirect_cleanliness ?? '—'}/100`} colorClass={scoreColor(score.redirect_cleanliness)} />
          </div>

          {/* Issues */}
          {score.issues?.length > 0 && (
            <div className="text-[11px] text-red-400 space-y-0.5">
              {score.issues.slice(0, 3).map((issue, i) => (
                <div key={i} className="flex items-start gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {score.recommendations?.length > 0 && (
            <div className="text-[11px] text-amber-400/80 space-y-0.5">
              {score.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="shrink-0">→</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Optimize button */}
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold
                       bg-gradient-to-r from-violet-600 to-blue-600 text-white
                       hover:from-violet-500 hover:to-blue-500 disabled:opacity-50
                       transition-all shadow-sm"
          >
            {optimizing ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Optimizing…</>
            ) : (
              <><Zap className="w-3 h-3" /> Optimize for Inbox</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default InboxScoreBadge;
