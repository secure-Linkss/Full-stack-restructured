import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Info, ShieldAlert, CreditCard, Ticket, Clock, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const TYPE_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'unread',       label: 'Unread' },
  { value: 'payment',      label: 'Payment' },
  { value: 'security',     label: 'Security' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'system',       label: 'System' },
];

const TYPE_CONFIG = {
  payment:      { icon: CreditCard,  color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.2)'  },
  security:     { icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)'   },
  ticket:       { icon: Ticket,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)'  },
  announcement: { icon: Bell,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.2)'  },
  system:       { icon: Info,        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.2)'  },
};
const DEFAULT_TYPE = TYPE_CONFIG.system;

const glass = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(new Set());

  const fetchNotifications = async () => {
    try {
      const response = await api.notifications?.getAll() || { notifications: [] };
      const data = response.notifications || response || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    } catch { toast.error('Action failed'); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success('Notification deleted');
    } catch { toast.error('Failed to delete notification'); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} notification(s)?`)) return;
    try {
      await Promise.all([...selected].map(id => api.notifications.delete(id)));
      setNotifications(prev => prev.filter(n => !selected.has(n.id)));
      setSelected(new Set());
      toast.success(`${selected.size} notifications deleted`);
    } catch { toast.error('Bulk delete failed'); }
  };

  const toggleSelect   = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleSelectAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(n => n.id)));

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read && !n.read;
    if (filter === 'all')    return true;
    return (n.notification_type || n.type) === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6 w-full max-w-3xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '8px' }}>
              <Bell className="w-5 h-5" style={{ color: '#3b82f6' }} />
            </div>
            <h1 className="text-2xl font-bold text-white/90" style={{ letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
              Account Notifications
            </h1>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: '#3b82f6' }}
              >
                {unreadCount}
              </motion.span>
            )}
          </div>
          <p className="text-sm text-white/35 ml-14">Updates on payments, security, and support.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5 text-red-400 border-red-400/20 hover:bg-red-400/10">
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selected.size})
            </button>
          )}
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="text-xs px-3.5 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all duration-200"
            style={filter === f.value
              ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 12px rgba(59,130,246,0.12)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List panel */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <Bell className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-base font-semibold text-white/70 mb-1">
              {filter !== 'all' ? 'No notifications match this filter.' : "You're all caught up!"}
            </h3>
            <p className="text-sm text-white/30">Check back later for updates.</p>
          </div>
        ) : (
          <>
            {/* Bulk select bar */}
            <div className="px-5 py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded accent-blue-500"
              />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <motion.div variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence>
                {filtered.map((n, idx) => {
                  const isRead = n.is_read || n.read;
                  const typeCfg = TYPE_CONFIG[n.notification_type || n.type] || DEFAULT_TYPE;
                  const Icon = typeCfg.icon;
                  return (
                    <motion.div
                      key={n.id}
                      variants={itemVariants}
                      exit="exit"
                      className="group flex gap-4 px-5 py-4 cursor-default transition-colors"
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: !isRead ? 'rgba(59,130,246,0.03)' : 'transparent',
                        borderLeft: !isRead ? '2px solid rgba(59,130,246,0.5)' : '2px solid transparent',
                      }}
                    >
                      {/* Checkbox + icon */}
                      <div className="flex items-start gap-3 shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={selected.has(n.id)}
                          onChange={() => toggleSelect(n.id)}
                          className="rounded accent-blue-500 mt-1"
                          onClick={e => e.stopPropagation()}
                        />
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: typeCfg.bg, border: `1px solid ${typeCfg.border}`, opacity: isRead ? 0.5 : 1 }}
                        >
                          <Icon className="w-4 h-4" style={{ color: typeCfg.color }} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-3">
                          <h4 className="text-sm leading-tight" style={{
                            color: isRead ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.9)',
                            fontWeight: isRead ? 400 : 600,
                          }}>
                            {n.title}
                            {!isRead && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ml-2 align-middle" />
                            )}
                          </h4>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-white/25 whitespace-nowrap flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: isRead ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)' }}>
                          {n.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            title="Mark as read"
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: '#3b82f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-white/30 hover:text-red-400"
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;
