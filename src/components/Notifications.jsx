import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, ShieldAlert, CreditCard, Ticket, Clock, Trash2, Filter } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'payment', label: 'Payment' },
  { value: 'security', label: 'Security' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'system', label: 'System' },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
    } catch {
      toast.error('Action failed');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} notification(s)?`)) return;
    try {
      await Promise.all([...selected].map(id => api.notifications.delete(id)));
      setNotifications(prev => prev.filter(n => !selected.has(n.id)));
      setSelected(new Set());
      toast.success(`${selected.size} notifications deleted`);
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(n => n.id)));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-5 h-5 text-[#10b981]" />;
      case 'security': return <ShieldAlert className="w-5 h-5 text-[#ef4444]" />;
      case 'ticket': return <Ticket className="w-5 h-5 text-[#f59e0b]" />;
      case 'announcement': return <Bell className="w-5 h-5 text-[#8b5cf6]" />;
      default: return <Info className="w-5 h-5 text-[#3b82f6]" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read && !n.read;
    if (filter === 'all') return true;
    return (n.notification_type || n.type) === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center">
            <Bell className="w-6 h-6 mr-3 text-[#3b82f6]" />
            Account Notifications
            {unreadCount > 0 && (
              <span className="ml-3 text-xs font-bold bg-[#3b82f6] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Updates on payments, security, and support.</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} className="btn-secondary text-xs px-4 text-red-400 border-red-400/30 hover:bg-red-400/10">
              <Trash2 className="w-4 h-4 mr-2" /> Delete ({selected.size})
            </button>
          )}
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary text-xs px-4">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 mr-1" />
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-all border ${
              filter === f.value
                ? 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-[#3b82f6]/30'
                : 'text-muted-foreground border-transparent hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#3b82f6]/20 border-t-[#3b82f6] animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== 'all' ? 'No notifications match this filter.' : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <>
            {/* Bulk select header */}
            {filtered.length > 0 && (
              <div className="px-5 py-2.5 border-b border-border flex items-center gap-3 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="divide-y divide-border">
              {filtered.map(notification => {
                const isRead = notification.is_read || notification.read;
                return (
                  <div
                    key={notification.id}
                    className={`p-5 flex gap-3 transition-colors hover:bg-white/5 ${!isRead ? 'bg-[rgba(59,130,246,0.03)]' : ''}`}
                  >
                    <div className="flex items-start gap-3 shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={selected.has(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="rounded mt-0.5"
                        onClick={e => e.stopPropagation()}
                      />
                      <div className={!isRead ? 'opacity-100' : 'opacity-50'}>
                        {getIcon(notification.notification_type || notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm tracking-wide ${!isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {notification.title}
                          {!isRead && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#3b82f6] align-middle" />}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground whitespace-nowrap ml-4 flex items-center shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm ${!isRead ? 'text-muted-foreground/90' : 'text-muted-foreground/60'}`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 ml-2">
                      {!isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3b82f6]/10 text-[#3b82f6] transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
