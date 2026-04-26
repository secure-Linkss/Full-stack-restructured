import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, CheckCircle, Clock, Search, Send, Trash2, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

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
    // Mark as read if new
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
      const newReply = {
        admin_name: 'You',
        message: replyText,
        created_at: new Date().toISOString(),
      };
      const updatedContact = {
        ...activeContact,
        status: 'replied',
        replies: [...(activeContact.replies || []), newReply],
      };
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

  const getStatusBadgeClass = (status) => {
    if (status === 'resolved') return 'badge-dim-green';
    if (status === 'replied') return 'text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 text-[9px] px-1.5 py-0 rounded font-semibold uppercase';
    if (status === 'read') return 'text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[9px] px-1.5 py-0 rounded font-semibold uppercase';
    return 'badge-dim-amber'; // new / unread
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
    <div className="space-y-4 animate-fade-in w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#3b82f6]" /> Contact Inbox
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} total submissions from the public contact form</p>
        </div>
        <button onClick={() => fetchData(page)} className="btn-secondary text-xs px-3" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        {/* LEFT: Contact List */}
        <div className="lg:col-span-1 enterprise-card flex flex-col h-full overflow-hidden border-[#1e2d47]/60">
          <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.01)] shrink-0 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, subject..."
                className="enterprise-input pl-9 w-full text-xs h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'new', 'replied', 'resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-semibold capitalize ${filter === f ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-muted-foreground hover:bg-white/5'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No contact submissions found.
              </div>
            ) : (
              filtered.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => openContact(sub)}
                  className={`w-full text-left p-3 mb-2 rounded-lg border transition-all ${activeContact?.id === sub.id ? 'bg-[rgba(59,130,246,0.05)] border-[#3b82f6]/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-foreground truncate pr-2">{sub.name || 'Anonymous'}</span>
                    <span className={getStatusBadgeClass(sub.status || 'new')}>{sub.status || 'new'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mb-1">{sub.email}</p>
                  <p className="text-xs text-foreground/70 truncate mb-2">{sub.subject || '(no subject)'}</p>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}</span>
                    {(sub.replies || []).length > 0 && (
                      <span className="text-[#10b981] font-semibold">{sub.replies.length} repl{sub.replies.length === 1 ? 'y' : 'ies'}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div className="flex justify-center gap-2 p-3 border-t border-border shrink-0">
              <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="btn-secondary text-xs px-3 disabled:opacity-40">Prev</button>
              <span className="text-xs text-muted-foreground self-center">Page {page}</span>
              <button onClick={() => fetchData(page + 1)} disabled={submissions.length < 30} className="btn-secondary text-xs px-3 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>

        {/* RIGHT: Thread / Detail Panel */}
        <div className="lg:col-span-2 enterprise-card flex flex-col h-full overflow-hidden relative border-[#1e2d47]/60">
          {activeContact ? (
            <div className="flex flex-col h-full animate-fade-in w-full">
              {/* Header */}
              <div className="p-5 border-b border-border bg-[rgba(255,255,255,0.01)] shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-heading font-bold text-foreground mb-1">
                      {activeContact.subject || '(no subject)'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{activeContact.name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{activeContact.email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activeContact.created_at ? new Date(activeContact.created_at).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={getStatusBadgeClass(activeContact.status || 'new')}>{activeContact.status || 'new'}</span>
                    {activeContact.status !== 'resolved' && (
                      <button onClick={() => handleResolve(activeContact)} className="btn-secondary text-xs px-2 py-1 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10">
                        <CheckCircle className="w-3.5 h-3.5 mr-1 inline" />Resolve
                      </button>
                    )}
                    <button onClick={() => handleDelete(activeContact)} className="btn-secondary text-xs px-2 py-1 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1 inline" />Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Thread Area */}
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5 bg-background/30">
                {/* Original message */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <div className="bg-[rgba(255,255,255,0.03)] border border-border p-4 rounded-xl rounded-tl-sm w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#3b82f6]">{activeContact.name || 'Anonymous'} &lt;{activeContact.email}&gt;</span>
                      <span className="text-[10px] text-muted-foreground">{activeContact.created_at ? new Date(activeContact.created_at).toLocaleString() : '—'}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{activeContact.message || '(empty)'}</p>
                  </div>
                </div>

                {/* Admin replies */}
                {(activeContact.replies || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-4 flex-row-reverse">
                    <div className="w-8 h-8 rounded bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div className="bg-[rgba(16,185,129,0.05)] border border-[#10b981]/20 p-4 rounded-xl rounded-tr-sm w-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#10b981]">{r.admin_name || 'Support Agent'}</span>
                        <span className="text-[10px] text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              {/* Reply box */}
              {activeContact.status !== 'resolved' && (
                <div className="p-4 border-t border-border bg-card shrink-0">
                  <form onSubmit={handleReply} className="relative">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeContact.email}...`}
                      className="enterprise-input w-full pr-[130px] text-sm py-3 min-h-[70px] max-h-[140px]"
                      disabled={replying}
                      required
                    />
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground hidden sm:block">Admin Reply</span>
                      <button
                        type="submit"
                        disabled={!replyText.trim() || replying}
                        className="btn-primary px-4 shadow-lg disabled:opacity-50 text-sm"
                      >
                        {replying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5 inline" />}
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeContact.status === 'resolved' && (
                <div className="p-4 border-t border-border text-center bg-card shrink-0">
                  <span className="text-xs text-[#10b981] flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> This enquiry is resolved
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-60">
              <Mail className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-foreground">Contact Inbox</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Select a contact submission from the left to view the message and reply directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;
