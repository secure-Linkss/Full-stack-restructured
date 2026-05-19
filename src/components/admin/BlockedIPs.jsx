import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, RefreshCw, ShieldBan, Ban } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const BlockedIPs = () => {
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.security.getBlockedIPs();
      setBlockedIPs(data);
    } catch (error) {
      toast.error('Failed to load blocked IPs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) return toast.error('IP address cannot be empty.');
    setLoading(true);
    try {
      await api.admin.security.addBlockedIP(newIP.trim());
      setNewIP('');
      await fetchBlockedIPs();
      toast.success(`IP ${newIP} blocked.`);
    } catch {
      toast.error('Failed to block IP address.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIP = async (ip) => {
    setLoading(true);
    try {
      await api.admin.security.removeBlockedIP(ip);
      await fetchBlockedIPs();
      toast.success(`IP ${ip} unblocked.`);
    } catch {
      toast.error('Failed to unblock IP address.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlockedIPs(); }, []);

  return (
    <div
      className="rounded-[14px] p-5"
      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <ShieldBan className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-400">Blocked IPs</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{blockedIPs.length} address{blockedIPs.length !== 1 ? 'es' : ''} blocked</p>
        </div>
        <button
          onClick={fetchBlockedIPs}
          disabled={loading}
          className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-red-400/70 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
          value={newIP}
          onChange={(e) => setNewIP(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddIP()}
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white bg-transparent disabled:opacity-50 outline-none"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.25)' }}
        />
        <button
          onClick={handleAddIP}
          disabled={loading || !newIP.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-400 transition-all disabled:opacity-40"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <Ban className="w-3.5 h-3.5" /> Block
        </button>
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 animate-spin" />
            </div>
          </div>
        ) : blockedIPs.length === 0 ? (
          <p className="text-center text-xs py-6" style={{ color: 'rgba(239,68,68,0.5)' }}>No IPs blocked.</p>
        ) : (
          <AnimatePresence>
            {blockedIPs.map((ip, i) => (
              <motion.div
                key={ip}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}
              >
                <code className="text-xs text-red-300 font-mono">{ip}</code>
                <button
                  onClick={() => handleRemoveIP(ip)}
                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                  title="Unblock"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default BlockedIPs;
