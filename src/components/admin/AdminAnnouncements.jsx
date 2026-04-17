import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, Plus, RefreshCw, Trash2, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import api from '../../services/api';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.admin?.announcements?.getAll();
      const announcementsData = res?.announcements || res || [];
      setAnnouncements(announcementsData.map(a => ({
        ...a,
        content: a.message || a.content || '',
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
      setFormData({ title: announcement.title, content: announcement.content || '', status: announcement.status || 'active' });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', status: 'active' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return toast.error('Title is required.');
    if (!formData.content) return toast.error('Message content is required.');
    setSaving(true);
    try {
      const payload = { title: formData.title, message: formData.content };
      if (editingId) {
        await api.admin.announcements.update(editingId, payload);
        toast.success('Announcement updated.');
      } else {
        const res = await api.admin.announcements.create(payload);
        toast.success(res?.message || 'Announcement sent to all users.');
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
    if (!window.confirm(`Delete announcement "${row.title}"?`)) return;
    try {
      await api.admin.announcements.delete(row.id);
      toast.success('Announcement deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete announcement.');
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => <span className="font-medium text-[#3b82f6]">{row.title}</span>,
    },
    {
      header: 'Message',
      accessor: 'content',
      cell: (row) => <span className="text-sm text-muted-foreground line-clamp-2">{row.content}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
          row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
        }`}>
          {row.status || 'active'}
        </span>
      ),
    },
    {
      header: 'Sent',
      accessor: 'publishedAt',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{new Date(row.publishedAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      <Card className="border-[#1e2d47]">
        <CardHeader className="bg-[#141d2e] rounded-t-lg border-b border-[#1e2d47] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center"><Megaphone className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global Announcements</CardTitle>
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
                  <DropdownMenuContent align="end" className="w-48 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest">Options</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => openModal(row)} className="text-xs cursor-pointer focus:bg-white/5">
                      <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => handleDelete(row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#141d2e] border-[#1e2d47] text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>Push a notification to all user dashboards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="enterprise-input"
                placeholder="e.g. Scheduled Maintenance"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Message</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="enterprise-input min-h-[120px] resize-none"
                placeholder="Enter announcement details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-white">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="btn-primary shadow-lg">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? 'Save Changes' : 'Send to All Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
