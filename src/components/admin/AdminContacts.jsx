import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, Clock, Search, Eye, X, Send, Trash2, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';

const AdminContacts = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact/submissions?page=${p}&per_page=20`, { credentials: 'include' });
      const data = await res.json();
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

  const handleView = async (sub) => {
    setViewing(sub);
    setReplyText('');
    // Mark as read if unread
    if (!sub.status || sub.status === 'unread') {
      try {
        await fetch(`/api/admin/contact/${sub.id}/read`, { method: 'POST', credentials: 'include' });
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'read' } : s));
      } catch { /* silent */ }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/contact/${viewing.id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success(`Reply sent to ${viewing.email}`);
      setReplyText('');
      fetchData(page);
      setViewing(prev => ({ ...prev, status: 'read', replied: true }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async (sub) => {
    try {
      const res = await fetch(`/api/admin/contact/${sub.id}/resolve`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Enquiry marked as resolved.');
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'resolved' } : s));
      if (viewing?.id === sub.id) setViewing(prev => ({ ...prev, status: 'resolved' }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete enquiry from ${sub.name || sub.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/contact/${sub.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Enquiry deleted.');
      if (viewing?.id === sub.id) setViewing(null);
      fetchData(page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = submissions.filter(s =>
    !search ||
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s) => {
    if (s === 'resolved') return 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20';
    if (s === 'read') return 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20';
    return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-heading text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#3b82f6]" /> Contact Submissions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} total submissions from the public contact form</p>
        </div>
        <button onClick={() => fetchData(page)} className="btn-secondary text-sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, email, or subject..."
          className="enterprise-input pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="enterprise-table w-full">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th className="text-center">Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-muted-foreground">Loading contact submissions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <Mail className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No contact submissions yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Messages from the public contact form will appear here.</p>
                  </td>
                </tr>
              ) : filtered.map(sub => (
                <tr key={sub.id} className="group">
                  <td className="py-3">
                    <p className="text-sm font-medium text-foreground">{sub.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                  </td>
                  <td className="py-3">
                    <p className="text-sm text-foreground">{sub.subject || '(no subject)'}</p>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor(sub.status || 'unread')}`}>
                      {sub.status || 'Unread'}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="text-xs text-muted-foreground">{sub.created_at ? new Date(sub.created_at).toLocaleString() : '—'}</p>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleView(sub)} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="View & Reply">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {sub.status !== 'resolved' && (
                        <button onClick={() => handleResolve(sub)} className="p-1.5 rounded hover:bg-[#10b981]/10 text-muted-foreground hover:text-[#10b981] transition-colors" title="Mark Resolved">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(sub)} className="p-1.5 rounded hover:bg-[#ef4444]/10 text-muted-foreground hover:text-[#ef4444] transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
          <span className="text-sm text-muted-foreground self-center">Page {page}</span>
          <button onClick={() => fetchData(page + 1)} disabled={submissions.length < 20} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* View + Reply Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="enterprise-card w-full max-w-2xl mx-4 p-0 shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#10b981]"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-border shrink-0">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-[#3b82f6]" /> Contact Message</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{viewing.name || 'Anonymous'} &lt;{viewing.email}&gt;</p>
              </div>
              <div className="flex items-center gap-2">
                {viewing.status !== 'resolved' && (
                  <button onClick={() => handleResolve(viewing)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
                <button onClick={() => handleDelete(viewing)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button onClick={() => setViewing(null)} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Message Details */}
            <div className="p-5 space-y-3 border-b border-border shrink-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-xs font-semibold text-muted-foreground uppercase">Subject</span><p className="text-foreground mt-0.5">{viewing.subject || '(no subject)'}</p></div>
                <div><span className="text-xs font-semibold text-muted-foreground uppercase">Date</span><p className="text-foreground mt-0.5">{viewing.created_at ? new Date(viewing.created_at).toLocaleString() : '—'}</p></div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Message</span>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-black/20 rounded p-3 border border-border mt-1">{viewing.message || '(empty)'}</p>
              </div>
            </div>

            {/* Reply Thread */}
            {viewing.replies && viewing.replies.length > 0 && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-background/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin Replies</p>
                {viewing.replies.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-[#3b82f6]" />
                    </div>
                    <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-lg p-3 flex-1">
                      <p className="text-xs font-semibold text-[#3b82f6] mb-1">{r.admin_name || 'Admin'} <span className="text-muted-foreground font-normal">&middot; {r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span></p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Box */}
            {viewing.status !== 'resolved' && (
              <div className="p-4 border-t border-border bg-card shrink-0">
                <form onSubmit={handleReply} className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Reply to {viewing.email}</p>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="enterprise-input w-full text-sm min-h-[80px] max-h-[150px] resize-y"
                    disabled={replying}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setViewing(null)} className="btn-secondary text-sm px-4">Close</button>
                    <button type="submit" disabled={!replyText.trim() || replying} className="btn-primary text-sm px-4 disabled:opacity-50 flex items-center gap-2">
                      {replying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            )}

            {viewing.status === 'resolved' && (
              <div className="p-4 border-t border-border text-center">
                <span className="text-xs text-[#10b981] flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> This enquiry is resolved</span>
                <button onClick={() => setViewing(null)} className="btn-secondary text-sm px-4 mt-2">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
