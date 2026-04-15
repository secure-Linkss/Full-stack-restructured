import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, Clock, Search, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

const AdminContacts = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
                    <button
                      onClick={() => setViewing(sub)}
                      className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="enterprise-card w-full max-w-lg mx-4 p-0 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3b82f6] to-[#10b981]"></div>
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-[#3b82f6]" /> Contact Message</h3>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'From', value: `${viewing.name || 'Anonymous'} <${viewing.email}>` },
                { label: 'Subject', value: viewing.subject || '(no subject)' },
                { label: 'Date', value: viewing.created_at ? new Date(viewing.created_at).toLocaleString() : '—' },
                { label: 'Status', value: viewing.status || 'Unread' },
              ].map(f => (
                <div key={f.label} className="flex gap-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase w-16 shrink-0 mt-0.5">{f.label}</span>
                  <span className="text-sm text-foreground">{f.value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Message</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-black/20 rounded p-3 border border-border">{viewing.message || '(empty)'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button onClick={() => setViewing(null)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
