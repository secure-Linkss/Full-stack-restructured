import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Plus, RefreshCw, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import { fetchMockData } from '../../services/mockApi';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const announcementsData = await fetchMockData('getAdminAnnouncements');
      setAnnouncements(announcementsData);
      toast.success('Announcements refreshed.');
    } catch (error) {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (action, announcement) => {
    toast.info(`${action} action triggered for announcement: ${announcement.title}`);
    // Mock action logic
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
          row.status === 'active' ? 'bg-green-500/20 text-green-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Published Date',
      accessor: 'publishedAt',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.publishedAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleAction('Edit', row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction('Delete', row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Megaphone className="h-5 w-5 mr-2 text-primary" /> Announcements</CardTitle>
          <p className="text-sm text-muted-foreground">Create and manage system-wide announcements for users.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleAction('Create New Announcement', {})}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Announcements...</div>
          ) : (
            <DataTable
              columns={columns}
              data={announcements}
              pageSize={5}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;
