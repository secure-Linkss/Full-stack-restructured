import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, change, unit = '', description, className = '', accent = '#3b82f6' }) => {
  const changeValue = parseFloat(change);
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative rounded-xl p-5 overflow-hidden group ${className}`}
      style={{
        background: 'rgba(8,15,35,0.72)',
        backdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em]">{title}</p>
        {Icon && (
          <div className="p-1.5 rounded-lg" style={{ background: `${accent}18` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-white tabular-nums" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.03em' }}>
        {value}
        {unit && <span className="text-sm font-normal text-white/35 ml-1">{unit}</span>}
      </div>

      {change !== undefined && !isNaN(changeValue) && (
        <p className="text-[11px] mt-2 flex items-center gap-1">
          {isPositive ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <ArrowUp className="w-3 h-3" />{Math.abs(changeValue)}%
            </span>
          ) : isNegative ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <ArrowDown className="w-3 h-3" />{Math.abs(changeValue)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold text-white/30" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Minus className="w-3 h-3" />0%
            </span>
          )}
          <span className="text-white/25">vs last period</span>
        </p>
      )}

      {description && <p className="text-[11px] text-white/30 mt-1.5">{description}</p>}
    </motion.div>
  );
};

export default MetricCard;
