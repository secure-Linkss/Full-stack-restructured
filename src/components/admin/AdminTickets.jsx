import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Search, CheckCircle, RefreshCw, Send, ShieldAlert, User, Mail, Shield, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] } })
};

const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const StatusBadge = ({ status }) => {
  const map = {
    open: { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', label: 'Open' },
    in_progress: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: 'In Progress' },
    waiting_response: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: 'Waiting' },
    resolved: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: 'Resolved' },
    closed: { bg: 'bg-white/5', text: 'text-white/40', label: 'Closed' },
  };
  const s = map[status] || map.open;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    high: { bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', label: 'High' },
    medium: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: 'Medium' },
    low: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: 'Low' },
  };
  const p = map[priority];
  if (!p) return null;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${p.bg} ${p.text}`}>
      {p.label}
    </span>
  );
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const threadEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const fetchTickets = async () => {
    try {
      const response = await api.adminTickets.getAll();
      const data = response.tickets || response || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
    setLoadingThread(true);
    try {
      const full = await api.adminTickets.getById(ticket.id);
      setActiveTicket(full.ticket || full);
      scrollToBottom();
    } catch {
      // keep list-view data if detail fetch fails
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.adminTickets.reply(activeTicket.id, replyMessage);
      toast.success('Reply submitted and sent to user.');
      setReplyMessage('');
      const full = await api.adminTickets.getById(activeTicket.id);
      setActiveTicket(full.ticket || full);
      scrollToBottom();
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm(`Mark ticket #${activeTicket.id} as resolved?`)) return;
    try {
      await api.adminTickets.close(activeTicket.id);
      toast.success('Ticket marked as resolved.');
      setActiveTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
      fetchTickets();
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  const handleDeleteTicket = async (ticket) => {
    if (!window.confirm(`Permanently delete ticket ${ticket.id || ticket.subject}?`)) return;
    try {
      await api.adminTickets.delete(ticket.id);
      toast.success('Ticket deleted.');
      if (activeTicket?.id === ticket.id) setActiveTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to delete ticket.');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !(t.subject || '').toLowerCase().includes(search.toLowerCase()) && !(t.id || '').toLowerCase().includes(search.toLowerCase()) && !(t.user_email || t.email || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3b82f6]" />
            Global Support Hub
          </h3>
          <p className="text-xs text-white/40 mt-0.5">Manage user communications and active support tickets.</p>
        </div>
        <button
          onClick={fetchTickets}
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}
          className="flex items-center gap-2 text-[#3b82f6] text-xs px-3 py-2 hover:bg-[#3b82f6]/20 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Queues
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        {/* Ticket List Panel */}
        <motion.div
          custom={0} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-1 flex flex-col overflow-hidden"
          style={glassCard}
        >
          {/* Search + Filters */}
          <div
            className="p-4 shrink-0 space-y-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search ID, Subject, or Email..."
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                className="w-full pl-9 pr-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex-1 text-[11px] py-1.5 rounded-md font-semibold transition-colors"
                  style={{
                    background: filter === f.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: filter === f.key ? '#3b82f6' : 'rgba(255,255,255,0.35)',
                    border: filter === f.key ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                </div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-xs">No tickets in queue.</span>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: activeTicket?.id === ticket.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                      border: activeTicket?.id === ticket.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                    }}
                  >
                    <button
                      className="w-full text-left p-3 transition-all hover:bg-white/[0.03]"
                      onClick={() => openTicket(ticket)}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-[#3b82f6] uppercase tracking-widest">{ticket.id}</span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate mb-1">{ticket.subject}</h4>
                      <div className="flex items-center text-[10px] text-white/35 mb-2 truncate">
                        <Mail className="w-3 h-3 mr-1 shrink-0" />
                        {ticket.user_email || ticket.email || 'Unknown User'}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </button>
                    <div className="px-3 pb-2 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket); }}
                        className="flex items-center gap-1 text-[10px] text-[#ef4444]/50 hover:text-[#ef4444] transition-colors pt-2"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Detail Panel */}
        <motion.div
          custom={1} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-2 flex flex-col overflow-hidden"
          style={glassCard}
        >
          {activeTicket ? (
            <div className="flex flex-col h-full">
              {/* Thread Header */}
              <div className="p-5 shrink-0 flex justify-between items-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{activeTicket.subject}</h3>
                    <StatusBadge status={activeTicket.status} />
                    <PriorityBadge priority={activeTicket.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/35">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {activeTicket.user_email || activeTicket.email || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(activeTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {activeTicket.status !== 'resolved' && (
                  <button
                    onClick={handleCloseTicket}
                    className="flex items-center gap-1.5 text-xs text-[#10b981] px-3 py-1.5 rounded-lg shrink-0 hover:bg-[#10b981]/10 transition-colors"
                    style={{ border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5" style={{ background: 'rgba(0,0,0,0.15)' }}>
                {loadingThread ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="relative w-9 h-9">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                    </div>
                  </div>
                ) : (
                  <>
                    {(activeTicket.messages || []).length === 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                          <User className="w-4 h-4 text-[#3b82f6]" />
                        </div>
                        <div className="flex-1 rounded-xl rounded-tl-sm p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-[#3b82f6]">{activeTicket.user_email || activeTicket.email || 'Client'}</span>
                            <span className="text-[10px] text-white/30">{new Date(activeTicket.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{activeTicket.message || activeTicket._msg || 'No message content.'}</p>
                        </div>
                      </div>
                    )}
                    {(activeTicket.messages || []).map((msg, i) => {
                      const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'main_admin' || msg.is_admin_reply === true || msg.is_admin_reply === 'true';
                      return (
                        <motion.div
                          key={msg.id || i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: isAdmin ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                              border: isAdmin ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {isAdmin ? <Shield className="w-4 h-4 text-[#10b981]" /> : <User className="w-4 h-4 text-white/40" />}
                          </div>
                          <div
                            className={`flex-1 p-4 rounded-xl ${isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                            style={{
                              background: isAdmin ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                              border: isAdmin ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-xs font-bold ${isAdmin ? 'text-[#10b981]' : 'text-white/80'}`}>
                                {isAdmin ? 'Support Agent' : (msg.sender_email || activeTicket.user_email || 'Client')}
                              </span>
                              <span className="text-[10px] text-white/30">{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{msg.content || msg.message}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </>
                )}
              </div>

              {/* Reply Box */}
              {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                  <form onSubmit={handleReply} className="relative">
                    <textarea
                      required
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your official reply to the client..."
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10 }}
                      className="w-full pr-[150px] text-sm py-3 px-4 min-h-[80px] max-h-[150px] text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/60 transition-colors resize-none"
                      disabled={submitting}
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!replyMessage.trim() || submitting}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                      >
                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Reply
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <ShieldAlert className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white/60">Support Operations</h3>
              <p className="text-sm text-white/30 mt-1 max-w-sm">Select a ticket from the queue on the left to begin correspondence with the client.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminTickets;
