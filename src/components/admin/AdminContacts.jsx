import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, Clock, Search, Send, Trash2, User, Shield, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const exportContactsCSV = (submissions) => {
  if (!submissions.length) return toast.error('No contacts to export.');
  const rows = [['Name', 'Email', 'Subject', 'Message', 'Status', 'Date']];
  submissions.forEach(s => {
    rows.push([
      (s.name || 'Anonymous').replace(/,/g, ';'),
      s.email || '',
      (s.subject || '').replace(/,/g, ';'),
      (s.message || '').replace(/[\n\r,]/g, ' '),
      s.status || 'new',
      new Date(s.created_at).toISOString(),
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contacts_export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${submissions.length} contacts.`);
};

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
    new: { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', label: 'New' },
    read: { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', label: 'Read' },
    replied: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', label: 'Replied' },
    resolved: { bg: 'bg-white/5', text: 'text-white/40', label: 'Resolved' },
  };
  const s = map[status || 'new'] || map.new;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const UnreadDot = ({ status }) => {
  if (status && status !== 'new') return null;
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]" />
    </span>
  );
};

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const AdminContacts = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeContact, setActiveContact] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const threadEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.adminContacts.getSubmissions(p, 30);
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {
      toast.error('Failed to load contact submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openContact = async (sub) => {
    setActiveContact(sub);
    setReplyText('');
    scrollToBottom();
    if (sub.status === 'new' || !sub.status) {
      try {
        await api.adminContacts.markAsRead(sub.id);
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'read' } : s));
        setActiveContact(prev => prev ? { ...prev, status: 'read' } : null);
      } catch { /* silent */ }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeContact) return;
    setReplying(true);
    try {
      await api.adminContacts.reply(activeContact.id, replyText);
      toast.success(`Reply sent to ${activeContact.email}`);
      const newReply = { admin_name: 'You', message: replyText, created_at: new Date().toISOString() };
      const updatedContact = { ...activeContact, status: 'replied', replies: [...(activeContact.replies || []), newReply] };
      setActiveContact(updatedContact);
      setSubmissions(prev => prev.map(s => s.id === activeContact.id ? { ...s, status: 'replied' } : s));
      setReplyText('');
      scrollToBottom();
    } catch (err) {
      toast.error(err.message || 'Failed to send reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async (sub) => {
    try {
      await api.adminContacts.resolve(sub.id);
      toast.success('Enquiry marked as resolved.');
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'resolved' } : s));
      if (activeContact?.id === sub.id) setActiveContact(prev => ({ ...prev, status: 'resolved' }));
    } catch (err) {
      toast.error(err.message || 'Failed to resolve');
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete enquiry from ${sub.name || sub.email}?`)) return;
    try {
      await api.adminContacts.delete(sub.id);
      toast.success('Enquiry deleted.');
      if (activeContact?.id === sub.id) setActiveContact(null);
      fetchData(page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (!search) return true;
    return (
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.subject || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#3b82f6]" />
            Contact Inbox
          </h3>
          <p className="text-xs text-white/40 mt-0.5">{total} total submissions from the public contact form</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportContactsCSV(filtered)}
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}
            className="flex items-center gap-2 text-[#10b981] text-xs px-3 py-2 hover:bg-[#10b981]/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => fetchData(page)}
            disabled={loading}
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}
            className="flex items-center gap-2 text-[#3b82f6] text-xs px-3 py-2 hover:bg-[#3b82f6]/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        {/* Left: Contact List */}
        <motion.div
          custom={0} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-1 flex flex-col overflow-hidden"
          style={glassCard}
        >
          <div className="p-4 shrink-0 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search by name, email, subject..."
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                className="w-full pl-9 pr-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/50 transition-colors"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {['all', 'new', 'replied', 'resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-1 text-[10px] py-1.5 rounded-md font-semibold capitalize transition-colors"
                  style={{
                    background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: filter === f ? '#3b82f6' : 'rgba(255,255,255,0.35)',
                    border: filter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <Mail className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-xs">No contact submissions found.</span>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((sub, i) => (
                  <motion.button
                    key={sub.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => openContact(sub)}
                    className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: activeContact?.id === sub.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                      border: activeContact?.id === sub.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <UnreadDot status={sub.status} />
                        <span className="text-xs font-semibold text-white truncate max-w-[120px]">{sub.name || 'Anonymous'}</span>
                      </div>
                      <StatusBadge status={sub.status || 'new'} />
                    </div>
                    <p className="text-[11px] text-white/35 truncate mb-1">{sub.email}</p>
                    <p className="text-xs text-white/60 truncate mb-2">{sub.subject || '(no subject)'}</p>
                    <div className="flex justify-between items-center text-[10px] text-white/30">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {relativeTime(sub.created_at)}
                      </span>
                      {(sub.replies || []).length > 0 && (
                        <span className="text-[#10b981] font-semibold">
                          {sub.replies.length} repl{sub.replies.length === 1 ? 'y' : 'ies'}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>

          {total > 30 && (
            <div className="flex justify-center gap-2 p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="text-xs px-3 py-1 rounded text-white/50 hover:text-white disabled:opacity-30 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>Prev</button>
              <span className="text-xs text-white/40 self-center">Page {page}</span>
              <button onClick={() => fetchData(page + 1)} disabled={submissions.length < 30} className="text-xs px-3 py-1 rounded text-white/50 hover:text-white disabled:opacity-30 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>Next</button>
            </div>
          )}
        </motion.div>

        {/* Right: Thread Panel */}
        <motion.div
          custom={1} variants={cardVariants} initial="hidden" animate="visible"
          className="lg:col-span-2 flex flex-col overflow-hidden"
          style={glassCard}
        >
          {activeContact ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">{activeContact.subject || '(no subject)'}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{activeContact.name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{activeContact.email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{relativeTime(activeContact.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <StatusBadge status={activeContact.status || 'new'} />
                    {activeContact.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(activeContact)}
                        className="text-xs px-2 py-1 rounded-lg text-[#10b981] hover:bg-[#10b981]/10 transition-colors"
                        style={{ border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1 inline" />Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(activeContact)}
                      className="text-xs px-2 py-1 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                      style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 inline" />Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4" style={{ background: 'rgba(0,0,0,0.15)' }}>
                {/* Original message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <User className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <div className="flex-1 rounded-xl rounded-tl-sm p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#3b82f6]">{activeContact.name || 'Anonymous'} &lt;{activeContact.email}&gt;</span>
                      <span className="text-[10px] text-white/30">{relativeTime(activeContact.created_at)}</span>
                    </div>
                    <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{activeContact.message || '(empty)'}</p>
                  </div>
                </div>

                {/* Admin replies */}
                {(activeContact.replies || []).map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 flex-row-reverse"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <Shield className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div className="flex-1 rounded-xl rounded-tr-sm p-4" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#10b981]">{r.admin_name || 'Support Agent'}</span>
                        <span className="text-[10px] text-white/30">{relativeTime(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">{r.message}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={threadEndRef} />
              </div>

              {/* Reply box */}
              {activeContact.status !== 'resolved' ? (
                <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                  <form onSubmit={handleReply} className="relative">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeContact.email}...`}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10 }}
                      className="w-full pr-[120px] text-sm py-3 px-4 min-h-[70px] max-h-[140px] text-white placeholder-white/25 outline-none focus:border-[#3b82f6]/60 transition-colors resize-none"
                      disabled={replying}
                      required
                    />
                    <div className="absolute right-3 top-3">
                      <button
                        type="submit"
                        disabled={!replyText.trim() || replying}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                      >
                        {replying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 shrink-0 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-xs text-[#10b981] flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> This enquiry is resolved
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Mail className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white/60">Contact Inbox</h3>
              <p className="text-sm text-white/30 mt-1 max-w-sm">Select a contact submission from the left to view the message and reply directly.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminContacts;
