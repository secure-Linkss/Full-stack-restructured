import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, ShieldAlert, CreditCard, Ticket, Clock, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.notifications?.getAll() || { notifications: [] };
      const data = response.notifications || response || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      if (api.notifications?.markAsRead) await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (api.notifications?.markAllAsRead) await api.notifications.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-5 h-5 text-[#10b981]" />;
      case 'security': return <ShieldAlert className="w-5 h-5 text-[#ef4444]" />;
      case 'ticket': return <Ticket className="w-5 h-5 text-[#f59e0b]" />;
      default: return <Info className="w-5 h-5 text-[#3b82f6]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center">
             <Bell className="w-6 h-6 mr-3 text-[#3b82f6]" />
             Account Notifications
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Updates on payments, security, and support.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-secondary text-xs px-4">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
          </button>
        )}
      </div>

      <div className="enterprise-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#3b82f6]/20 border-t-[#3b82f6] animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">No new notifications at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-5 flex gap-4 transition-colors hover:bg-white/5 ${!notification.is_read ? 'bg-[rgba(59,130,246,0.03)]' : ''}`}>
                <div className={`mt-0.5 shrink-0 ${!notification.is_read ? 'opacity-100' : 'opacity-60'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm tracking-wide ${!notification.is_read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground whitespace-nowrap ml-4 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.is_read ? 'text-muted-foreground/90' : 'text-muted-foreground/60'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="shrink-0 flex items-center ml-2">
                    <button onClick={() => handleMarkAsRead(notification.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#3b82f6]/10 text-[#3b82f6] transition-colors" title="Mark as read">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
