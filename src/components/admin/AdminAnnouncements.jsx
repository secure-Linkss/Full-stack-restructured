import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, Plus, RefreshCw, Trash2, Edit, Save, Radio, Archive, CheckCircle2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import api from '../../services/api';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20', icon: Clock },
  archived: { label: 'Archived', color: 'bg-[#64748b]/10 text-[#64748b] border-[#64748b]/20', icon: Archive },
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.admin?.announcements?.getAll();
      const raw = res?.announcements || res || [];
      setAnnouncements(raw.map(a => ({
        ...a,
        content: a.message || a.content || '',
        status: a.status || 'active',
        publishedAt: a.created_at || new Date().toISOString(),
      })));
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (announcement = null) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title || '',
        content: announcement.content || announcement.message || '',
        status: announcement.status || 'active',
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', status: 'active' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error('Title is required.');
    if (!formData.content.trim()) return toast.error('Message content is required.');
    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.content.trim(),
        status: formData.status,
      };
      if (editingId) {
        await api.admin.announcements.update(editingId, payload);
        toast.success('Announcement updated.');
      } else {
        const res = await api.admin.announcements.create(payload);
        toast.success(res?.message || 'Announcement broadcast to all users.');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete announcement "${row.title}"? This will remove it for all users.`)) return;
    try {
      await api.admin.announcements.delete(row.id);
      toast.success('Announcement deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete announcement.');
    }
  };

  const handleBroadcast = async (row) => {
    if (!window.confirm(`Re-broadcast "${row.title}" to ALL active users now?`)) return;
    setBroadcasting(row.id);
    try {
      // Use the broadcaster endpoint directly if re-broadcast endpoint exists, fallback to create
      if (api.admin.announcements.broadcast) {
        await api.admin.announcements.broadcast(row.id);
      } else {
        await api.admin.announcements.create({ title: row.title, message: row.content });
      }
      toast.success(`"${row.title}" re-broadcast to all users.`);
    } catch {
      toast.error('Broadcast failed.');
    } finally {
      setBroadcasting(null);
    }
  };

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.status === 'active').length,
    draft: announcements.filter(a => a.status === 'draft').length,
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => (
        <div>
          <span className="font-medium text-[#3b82f6]">{row.title}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{row.content}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.active;
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border uppercase ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Audience',
      accessor: 'recipients',
      cell: (row) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" />
          {row.recipients ? `${row.recipients} users` : 'All Users'}
        </span>
      ),
    },
    {
      header: 'Sent',
      accessor: 'publishedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Broadcasts', value: stats.total, color: '#3b82f6', icon: Megaphone },
          { label: 'Active', value: stats.active, color: '#10b981', icon: CheckCircle2 },
          { label: 'Draft', value: stats.draft, color: '#f59e0b', icon: Clock },
        ].map((c, i) => (
          <Card key={i} className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.label}</p>
                <h3 className="text-2xl font-heading font-bold" style={{ color: c.color }}>{c.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#1e2d47]">
        <CardHeader className="bg-[#141d2e] rounded-t-lg border-b border-[#1e2d47] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Megaphone className="h-5 w-5 mr-2 text-[#3b82f6]" />
              Global Announcements
            </CardTitle>
            <CardDescription className="mt-1">Broadcast messages to all user dashboards simultaneously.</CardDescription>
          </div>
          <Button onClick={() => openModal()} className="btn-primary shadow-lg shadow-[#3b82f6]/20">
            <Plus className="h-4 w-4 mr-2" /> New Announcement
          </Button>
        </CardHeader>
        <CardContent className="pt-6 bg-background min-h-[400px]">
          {loading ? (
            <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-muted-foreground p-10">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No announcements yet. Create one to broadcast to all users.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={announcements}
              pageSize={10}
              actions={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 border-[#1e2d47] hover:bg-[#1e2d47]/50 text-xs shadow-sm">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest">Options</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => openModal(row)}
                      className="text-xs cursor-pointer focus:bg-white/5"
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" /> Edit Announcement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBroadcast(row)}
                      disabled={broadcasting === row.id}
                      className="text-xs cursor-pointer text-[#3b82f6] focus:bg-[#3b82f6]/10 focus:text-[#3b82f6]"
                    >
                      {broadcasting === row.id
                        ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        : <Radio className="w-3.5 h-3.5 mr-2" />
                      }
                      Re-Broadcast to All
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => handleDelete(row)}
                      className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#141d2e] border-[#1e2d47] text-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#3b82f6]" />
              {editingId ? 'Edit Announcement' : 'New Broadcast Announcement'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the announcement content.' : 'This will be pushed as a notification to all active user dashboards.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="enterprise-input"
                placeholder="e.g. Scheduled Maintenance on May 1st"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Message</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="enterprise-input min-h-[120px] resize-none"
                placeholder="Enter announcement details here..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: key })}
                    className={`flex-1 py-1.5 px-3 rounded border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      formData.status === key
                        ? cfg.color
                        : 'border-[#1e2d47] text-muted-foreground hover:border-white/20'
                    }`}
                  >
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="btn-primary shadow-lg">
              {saving
                ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                : editingId ? <Save className="w-4 h-4 mr-2" /> : <Radio className="w-4 h-4 mr-2" />
              }
              {editingId ? 'Save Changes' : 'Broadcast to All Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
