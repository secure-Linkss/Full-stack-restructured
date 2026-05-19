import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Clock, Search, CheckCircle, RefreshCw,
  Send, AlertCircle, X, ShieldAlert, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

// ─── Design tokens ────────────────────────────────────────────────────────────
const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    open:              { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6',  label: 'Open' },
    in_progress:       { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'In Progress' },
    waiting_response:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'Waiting' },
    resolved:          { bg: 'rgba(16,185,129,0.12)',  color: '#10b981',  label: 'Resolved' },
    closed:            { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: 'Closed' },
  };
  const s = map[status] || map.open;
  return (
    <span
      className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
};

// ─── Priority badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = {
    high:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'High' },
    medium: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Medium' },
    normal: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Normal' },
    low:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Low' },
  };
  const p = map[priority] || map.normal;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest"
      style={{ background: p.bg, color: p.color }}
    >
      {p.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SupportTickets = () => {
  const [tickets, setTickets]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTicket, setActiveTicket]   = useState(null);
  const [isCreating, setIsCreating]       = useState(false);
  const [filter, setFilter]               = useState('all');
  const [search, setSearch]               = useState('');

  const [newTicket, setNewTicket]         = useState({ subject: '', message: '', priority: 'normal' });
  const [replyMessage, setReplyMessage]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const threadEndRef = useRef(null);

  const fetchTickets = async () => {
    try {
      const response = await api.support.getTickets();
      const data = response.tickets || response || [];
      setTickets(Array.isArray(data) ? data : []);
      if (activeTicket) {
        const updated = (Array.isArray(data) ? data : []).find(t => t.id === activeTicket.id);
        if (updated) openTicket(updated);
      }
    } catch (error) {
      toast.error('Failed to load support history.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const openTicket = async (ticket) => {
    setIsCreating(false);
    setLoadingThread(true);
    setActiveTicket(ticket);
    try {
      const full = await api.support.getTicket(ticket.id);
      const ticketData = full.ticket || full;
      setActiveTicket(ticketData);
      scrollToBottom();
    } catch {
      // keep list-view data if detail fetch fails
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) return toast.error('Subject and message required.');
    setSubmitting(true);
    try {
      await api.support.createTicket(newTicket);
      toast.success('Ticket submitted successfully.');
      setIsCreating(false);
      setNewTicket({ subject: '', message: '', priority: 'normal' });
      fetchTickets();
    } catch (error) {
      toast.error('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.support.replyToTicket(activeTicket.id, replyMessage);
      toast.success('Reply sent.');
      setReplyMessage('');
      const full = await api.support.getTicket(activeTicket.id);
      setActiveTicket(full.ticket || full);
      scrollToBottom();
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !(t.subject || '').toLowerCase().includes(search.toLowerCase()) && !(String(t.id) || '').includes(search.toLowerCase())) return false;
    return true;
  });

  const filterTabs = [
    { id: 'all',      label: 'All' },
    { id: 'open',     label: 'Open' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Support & Communication
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Directly communicate with technical support analysts.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
          onClick={() => { setIsCreating(true); setActiveTicket(null); }}
          className="btn-primary shadow-lg flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Open New Ticket
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-[600px]">

        {/* ── Ticket List ──────────────────────────────────────────────────── */}
        <motion.div
          style={{ ...glassCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {/* Search + Filters */}
          <div className="p-3 shrink-0 space-y-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="text"
                placeholder="Search tickets..."
                className="enterprise-input pl-9 w-full text-xs h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: filter === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: filter === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                    border: filter === tab.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                </div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No tickets found.
              </div>
            ) : (
              <AnimatePresence>
                {filteredTickets.map((ticket, i) => {
                  const isActive = activeTicket?.id === ticket.id;
                  return (
                    <motion.button
                      key={ticket.id}
                      variants={cardVariants}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                      onClick={() => openTicket(ticket)}
                      className="w-full text-left p-3 mb-1.5 rounded-xl transition-all"
                      style={{
                        background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                        border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          #{ticket.id}
                        </span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate mb-2">{ticket.subject}</h4>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* ── Action Area ───────────────────────────────────────────────────── */}
        <motion.div
          style={{ ...glassCard, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          className="lg:col-span-2 relative"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <AnimatePresence mode="wait">
            {isCreating ? (
              /* ── Create Form ───────────────────────────────────────────── */
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="p-6 h-full flex flex-col"
              >
                <div
                  className="flex justify-between items-center pb-4 mb-5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h3 className="text-lg font-bold text-white">Submit New Support Ticket</h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={newTicket.subject}
                      onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="enterprise-input w-full text-sm"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Priority
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="enterprise-input w-full text-sm"
                    >
                      <option value="low">Low — General Question</option>
                      <option value="normal">Normal — Standard Support</option>
                      <option value="high">High — System Malfunction / Account Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Detailed Message
                    </label>
                    <textarea
                      required
                      value={newTicket.message}
                      onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="enterprise-input w-full h-40 text-sm py-3"
                      placeholder="Provide as much context as possible..."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-6 shadow-lg flex items-center gap-2"
                    >
                      {submitting
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />}
                      Submit Ticket
                    </button>
                  </div>
                </form>
              </motion.div>

            ) : activeTicket ? (
              /* ── Ticket Thread ─────────────────────────────────────────── */
              <motion.div
                key={`ticket-${activeTicket.id}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col h-full w-full"
              >
                {/* Thread header */}
                <div
                  className="p-5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white mb-1 truncate">{activeTicket.subject}</h3>
                      <div className="flex gap-3 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <span>ID: {activeTicket.id}</span>
                        <span>·</span>
                        <span>{new Date(activeTicket.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={activeTicket.status} />
                      {activeTicket.priority && <PriorityBadge priority={activeTicket.priority} />}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4"
                  style={{ background: 'rgba(4,12,30,0.4)' }}
                >
                  {loadingThread ? (
                    <div className="flex justify-center py-10">
                      <div className="relative w-7 h-7">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* No messages yet — show original ticket body */}
                      {(activeTicket.messages || []).length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}
                          >
                            Me
                          </div>
                          <div
                            className="flex-1 p-4 rounded-xl rounded-tl-sm"
                            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-blue-400">You</span>
                              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {new Date(activeTicket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                              {activeTicket.message || activeTicket._msg || 'No message content available.'}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Message thread */}
                      {(activeTicket.messages || []).map((msg, i) => {
                        const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'main_admin' || msg.is_admin_reply === true || msg.is_admin_reply === 'true';
                        return (
                          <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold"
                              style={{
                                background: isAdmin ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                                border: isAdmin ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(59,130,246,0.25)',
                                color: isAdmin ? '#10b981' : '#3b82f6',
                              }}
                            >
                              {isAdmin ? <ShieldAlert className="w-4 h-4" /> : 'Me'}
                            </div>
                            <div
                              className="flex-1 p-4 rounded-xl"
                              style={{
                                background: isAdmin ? 'rgba(16,185,129,0.06)' : 'rgba(59,130,246,0.06)',
                                border: isAdmin ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(59,130,246,0.15)',
                                borderRadius: isAdmin ? '12px 12px 12px 12px' : '12px 12px 12px 12px',
                              }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: isAdmin ? '#10b981' : '#3b82f6' }}
                                >
                                  {isAdmin ? 'Support Agent' : 'You'}
                                </span>
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  {new Date(msg.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                                {msg.content || msg.message}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={threadEndRef} />
                    </>
                  )}
                </div>

                {/* Reply box */}
                {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                  <div
                    className="p-4 shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}
                  >
                    <form onSubmit={handleReply} className="relative">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply to support..."
                        className="enterprise-input w-full pr-16 text-sm py-3 min-h-[60px] max-h-[120px]"
                        disabled={submitting}
                      />
                      <button
                        type="submit"
                        disabled={!replyMessage.trim() || submitting}
                        className="absolute right-3 top-3 p-2 rounded-lg transition-all disabled:opacity-40"
                        style={{ background: '#3b82f6', color: 'white' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                      >
                        {submitting
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>

            ) : (
              /* ── Empty State ───────────────────────────────────────────── */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-center p-10"
                style={{ opacity: 0.55 }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}
                >
                  <MessageSquare className="w-8 h-8 text-blue-400 opacity-60" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Select a Support Ticket</h3>
                <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Choose a ticket from the sidebar to view the conversation thread, or open a new one.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};

export default SupportTickets;
