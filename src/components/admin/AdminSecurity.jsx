import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Bot, Globe, Zap, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import RateLimiting from './RateLimiting';
import api from '../../services/api';

const StatBadge = ({ value, label, color = 'blue' }) => {
  const colors = { red: 'border-red-500/30 text-red-400', amber: 'border-amber-500/30 text-amber-400', green: 'border-green-500/30 text-green-400', blue: 'border-blue-500/30 text-blue-400', purple: 'border-purple-500/30 text-purple-400' };
  return (
    <div className={`enterprise-card p-4 border ${colors[color]}`}>
      <p className="text-2xl font-heading tabular-nums-custom">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

const AdminSecurity = () => {
  const [securityLogs, setSecurityLogs] = useState([]);
  const [intelligence, setIntelligence] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRaw, intel] = await Promise.all([
        api.adminLogs.getAll({ limit: 100 }).catch(() => []),
        api.admin.getIntelligence().catch(() => ({})),
      ]);

      const logsArr = Array.isArray(logsRaw) ? logsRaw : (logsRaw.logs || logsRaw.audit_logs || []);
      const logs = logsArr.map(log => ({
        timestamp: log.created_at || log.timestamp,
        event: log.action || log.event,
        source: log.username || (log.actor_id ? `User #${log.actor_id}` : 'System'),
        status: (log.action?.includes('fail') || log.action?.includes('error') || log.action?.includes('block')) ? 'Failed' : 'Success',
        ipAddress: log.ip_address || log.ip || 'N/A',
        details: log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 80) : String(log.details).slice(0, 80)) : '',
      }));
      setSecurityLogs(logs);
      setIntelligence(intel);
    } catch (error) {
      toast.error('Failed to load security data.');
      setSecurityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const traffic = intelligence.traffic_24h || {};
  const honeypot = intelligence.honeypot || {};
  const inboxScore = intelligence.inbox_score || {};

  const failedEvents = securityLogs.filter(l => l.status === 'Failed');
  const uniqueIPs = new Set(securityLogs.map(l => l.ipAddress).filter(ip => ip !== 'N/A')).size;

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</span>,
    },
    {
      header: 'Event',
      accessor: 'event',
      cell: (row) => <span className="text-sm font-medium">{row.event}</span>,
    },
    {
      header: 'User/Source',
      accessor: 'source',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.source}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          {row.status === 'Success' ? <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-500" />}
          <span className={`text-xs font-medium ${row.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>{row.status}</span>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      cell: (row) => <code className="text-xs text-muted-foreground">{row.ipAddress}</code>,
    },
    {
      header: 'Details',
      accessor: 'details',
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.details}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge value={traffic.bots || 0} label="Bots (24h)" color="red" />
        <StatBadge value={traffic.honeypot_hits || 0} label="Honeypot Hits (24h)" color="purple" />
        <StatBadge value={traffic.quantum_violations || 0} label="Quantum Violations" color="amber" />
        <StatBadge value={honeypot.blacklisted_ips || 0} label="Blacklisted IPs" color="red" />
        <StatBadge value={traffic.scanners || 0} label="Scanners (24h)" color="amber" />
        <StatBadge value={honeypot.abusive_asns || 0} label="Abusive ASNs" color="red" />
        <StatBadge value={failedEvents.length} label="Failed Events (logged)" color="amber" />
        <StatBadge value={uniqueIPs} label="Unique IPs (logged)" color="blue" />
      </div>

      {/* Bot detection + inbox score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm"><Bot className="h-4 w-4 mr-2 text-red-400" /> Bot Detection Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Bot Traffic %', value: `${traffic.bot_pct?.toFixed(1) || 0}%`, color: traffic.bot_pct > 20 ? 'text-red-400' : 'text-green-400' },
              { label: 'Scanner Traffic %', value: `${traffic.scanner_pct?.toFixed(1) || 0}%`, color: traffic.scanner_pct > 10 ? 'text-amber-400' : 'text-green-400' },
              { label: 'Known Bot UA Sigs', value: honeypot.known_bot_ua_signatures || 0, color: 'text-foreground' },
              { label: 'Total 24h Events', value: traffic.total || 0, color: 'text-foreground' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm"><Zap className="h-4 w-4 mr-2 text-purple-400" /> Inbox Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Average Score', value: `${inboxScore.average?.toFixed(1) || '—'} / 100`, color: (inboxScore.average || 0) >= 80 ? 'text-green-400' : 'text-amber-400' },
              { label: 'Excellent (90+)', value: inboxScore.distribution?.excellent || 0, color: 'text-green-400' },
              { label: 'Good (70–89)', value: inboxScore.distribution?.good || 0, color: 'text-blue-400' },
              { label: 'Warning (50–69)', value: inboxScore.distribution?.warning || 0, color: 'text-amber-400' },
              { label: 'Critical (<50)', value: inboxScore.distribution?.critical || 0, color: 'text-red-400' },
              { label: 'Sample Size', value: inboxScore.sample_size || 0, color: 'text-muted-foreground' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Rate limiting */}
      <RateLimiting />

      {/* Audit log table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2 text-primary" /> Security Event Logs</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">All authentication and admin actions ({securityLogs.length} events loaded)</p>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading security data...</div>
          ) : (
            <DataTable columns={columns} data={securityLogs} pageSize={15} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
