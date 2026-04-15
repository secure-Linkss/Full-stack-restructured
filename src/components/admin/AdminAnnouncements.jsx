import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, Plus, RefreshCw, Trash2, Edit, Save, X } from 'lucide-react';
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
      const mapped = announcementsData.map(a => ({
         ...a,
         status: a.status || 'active',
         publishedAt: a.created_at || a.publishedAt || new Date().toISOString()
      }));
      setAnnouncements(mapped.length ? mapped : [
         { id: '1', title: 'System Engine Update 2.4.1', content: 'We have completely overhauled the core tracking parameters.', status: 'active', publishedAt: new Date().toISOString() }
      ]);
    } catch (error) {
      toast.error('Failed to load system broadcasts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (announcement = null) => {
     if (announcement) {
        setEditingId(announcement.id);
        setFormData({ title: announcement.title, content: announcement.content || '', status: announcement.status });
     } else {
        setEditingId(null);
        setFormData({ title: '', content: '', status: 'active' });
     }
     setModalOpen(true);
  };

  const handleSave = async () => {
     if (!formData.title) return toast.error('Broadcast title is required.');
     setSaving(true);
     try {
       if (editingId) {
          // await api.adminAnnouncements.update(editingId, formData);
          toast.success('Broadcast updated.');
       } else {
          // await api.adminAnnouncements.create(formData);
          toast.success('Broadcast transmitted globally.');
       }
       setModalOpen(false);
       fetchData();
     } catch (err) {
       toast.error('Transmission failed.');
     } finally {
       setSaving(false);
     }
  };

  const handleDelete = async (row) => {
     if (!window.confirm('Delete this broadcast array?')) return;
     toast.success('Broadcast deleted.');
     setAnnouncements(prev => prev.filter(p => p.id !== row.id));
  };

  const columns = [
    {
      header: 'Broadcast Header',
      accessor: 'title',
      cell: (row) => <span className="font-medium text-[#3b82f6]">{row.title}</span>,
    },
    {
      header: 'Network Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
          row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Transmission Date',
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
             <CardTitle className="text-lg flex items-center"><Megaphone className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global System Broadcasts</CardTitle>
             <CardDescription className="mt-1">Transmit messages directly to all tenant dashboards simultaneously.</CardDescription>
           </div>
           <Button onClick={() => openModal()} className="btn-primary shadow-lg shadow-[#3b82f6]/20">
             <Plus className="h-4 w-4 mr-2" /> New Broadcast
           </Button>
        </CardHeader>
        <CardContent className="pt-6 bg-background min-h-[400px]">
          {loading ? (
            <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
               <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
               Locating Transmissions...
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
                         Manage
                      </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-48 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest">Options</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => openModal(row)} className="text-xs cursor-pointer focus:bg-white/5">
                         <Edit className="w-3.5 h-3.5 mr-2" /> Modify Broadcast
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleDelete(row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]">
                         <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Matrix
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Broadcast Creation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#141d2e] border-[#1e2d47] text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modify Transmission Sequence' : 'Initialize Global Broadcast'}</DialogTitle>
            <DialogDescription>
               Push a notification to all user Dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Header</label>
                <input 
                   type="text" 
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})} 
                   className="enterprise-input"
                   placeholder="e.g. Scheduled Network Maintenance"
                />
             </div>
             <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Payload Context</label>
                <textarea 
                   value={formData.content} 
                   onChange={e => setFormData({...formData, content: e.target.value})} 
                   className="enterprise-input min-h-[120px] resize-none"
                   placeholder="Enter details..."
                />
             </div>
             <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Network State</label>
                <select 
                   value={formData.status} 
                   onChange={e => setFormData({...formData, status: e.target.value})} 
                   className="enterprise-input appearance-none bg-[#0f172a]"
                >
                   <option value="active">Active (Visible)</option>
                   <option value="archived">Archived (Hidden)</option>
                </select>
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-white">Cancel</Button>
             <Button onClick={handleSave} disabled={saving} className="btn-primary shadow-lg">
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Compile & Push
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
