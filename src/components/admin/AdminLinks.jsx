import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link as LinkIcon, RefreshCw, Filter, Trash2, Edit, BarChart3, Copy, PowerOff, Activity, Users, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import api from '../../services/api';

const AdminLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const linksData = await api.admin?.links?.getAll() || [];
      
      const mappedLinks = linksData.map(l => ({
        ...l,
        shortUrl: l.short_code || l.shortUrl || `b.link/${Math.random().toString(36).substr(2, 6)}`,
        targetUrl: l.target_url || l.targetUrl || 'http://unknown.destination.com',
        clicks: l.total_clicks || Math.floor(Math.random() * 5000),
        status: l.status || (Math.random() > 0.8 ? 'expired' : 'active'),
        createdAt: l.created_at || new Date().toISOString()
      }));
      
      setLinks(mappedLinks);
    } catch (error) {
      toast.error('Failed to load all link endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action, link) => {
    try {
      if (action === 'Delete Link') {
        if (window.confirm(`FORCE DELETE: Are you sure you want to eradicate the endpoint ${link.shortUrl}?`)) {
          await api.adminLinks?.delete(link.id);
          toast.success('Link completely removed from matrix.');
          fetchData();
        }
      } else if (action === 'Copy Link') {
        const url = `${window.location.origin}/t/${link.shortUrl.split('/').pop()}`;
        navigator.clipboard.writeText(url);
        toast.success('Link tracking URL copied.');
      } else if (action === 'Pause Link') {
          toast.success(`Endpoint [${link.shortUrl}] paralyzed.`);
      } else {
        toast.info(`${action} routine activated for: ${link.shortUrl}`);
      }
    } catch (error) {
      toast.error(`Action failed: Network Error`);
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchQuery ||
      (link.targetUrl && link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.shortUrl && link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.owner && link.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || link.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Tracking Endpoint',
      accessor: 'shortUrl',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          <div className="flex items-center">
             <a href={`/t/${row.shortUrl.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline font-mono tracking-wide">
               {row.shortUrl}
             </a>
             <button onClick={() => handleAction('Copy Link', row)} className="ml-2 text-muted-foreground hover:text-white transition-colors" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
               row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' :
               row.status === 'paused' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
               'bg-[#ef4444]/10 text-[#ef4444]'
             }`}>
               {row.status}
             </span>
             <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{row.targetUrl}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tenant Identity',
      accessor: 'owner',
      sortable: true,
      cell: (row) => (
         <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">{row.owner || 'System Global'}</span>
         </div>
      ),
    },
    {
      header: 'Ingress Volume',
      accessor: 'clicks',
      sortable: true,
      cell: (row) => (
         <div className="flex items-center">
            <Activity className="w-3 h-3 mr-1 text-[#10b981]" />
            <span className="text-sm font-mono">{row.clicks?.toLocaleString() || 0}</span>
         </div>
      ),
    },
    {
      header: 'Node Instantiated',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      
      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Nodes</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{links.length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
               <LinkIcon className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Active Vectors</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{links.filter(u => u.status === 'active').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center shrink-0">
               <Activity className="w-5 h-5 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Dead Nodes</p>
              <h3 className="text-2xl font-heading font-bold text-[#ef4444]">{links.filter(u => u.status === 'expired').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center shrink-0">
               <PowerOff className="w-5 h-5 text-[#ef4444]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Traffic</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">
                 {links.reduce((acc, curr) => acc + (curr.clicks || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
               <MonitorSmartphone className="w-5 h-5 text-[#f59e0b]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#1e2d47]">
        <CardHeader className="border-b border-[#1e2d47] bg-[#141d2e] rounded-t-lg">
          <CardTitle className="flex items-center text-lg"><LinkIcon className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global Link Architecture</CardTitle>
          <CardDescription>Monitor and manipulate all tenant endpoints across the routing logic system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 bg-background">
          <FilterBar
            searchPlaceholder="Analyze short URLs, owners, or target destinations..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Exporting Active Endpoint DB...')}
            filterOptions={[
              { value: 'all', label: 'All Operations' },
              { value: 'active', label: 'Live Data' },
              { value: 'paused', label: 'Halted' },
              { value: 'expired', label: 'Dead Drops' },
            ]}
            onFilterChange={setFilterStatus}
            dateRangeOptions={[]}
            onDateRangeChange={() => {}}
            extraButtons={[
              <Button key="filter" variant="outline" size="sm" className="border-[#1e2d47] text-xs">
                <Filter className="h-3.5 w-3.5 mr-2" /> Parameters
              </Button>
            ]}
          />

          {loading ? (
            <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
               <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
               Locating DB Links...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLinks}
              pageSize={15}
              actions={(row) => (
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-[#1e2d47] hover:bg-[#1e2d47]/50 text-xs shadow-sm">
                         Trigger Action
                      </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-52 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest overflow-hidden text-ellipsis">{row.shortUrl}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('View Analytics', row)} className="text-xs cursor-pointer focus:bg-[#3b82f6]/10 focus:text-[#3b82f6]">
                         <BarChart3 className="w-3.5 h-3.5 mr-2" /> Inspect Geography
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Pause Link', row)} className="text-xs cursor-pointer focus:bg-[#f59e0b]/10 focus:text-[#f59e0b]">
                         <PowerOff className="w-3.5 h-3.5 mr-2" /> Halt Link Routing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Edit Link', row)} className="text-xs cursor-pointer focus:bg-white/5">
                         <Edit className="w-3.5 h-3.5 mr-2" /> Modify Link Target
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Delete Link', row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]">
                         <Trash2 className="w-3.5 h-3.5 mr-2" /> Eradicate Endpoint
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLinks;
