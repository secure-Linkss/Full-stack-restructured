import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { FileText, Filter, AlertTriangle, ShieldCheck, ShieldBan, ShieldAlert, Cpu, Network, Zap, Shield, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DataTable from '../ui/DataTable';
import api from '../../services/api';

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [threatMetrics, setThreatMetrics] = useState({ requests: 0, blocks: 0, attacks: 0, uptime: '0.00%' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, threatsData, firewallStats] = await Promise.all([
         api.adminLogs.getAll().catch(() => []),
         api.adminSecurity.getThreats().catch(() => []),
         api.quantum.getSecurityDashboard().catch(() => ({ requests: 0, blocks: 0, attacks: 0, uptime: 'Unknown'}))
      ]);
      
      setLogs(Array.isArray(logsData) ? logsData : []);
      setBlockedIPs(Array.isArray(threatsData) ? threatsData : []);
      setThreatMetrics({
         requests: firewallStats.requests || 0,
         blocks: firewallStats.blocks || 0,
         attacks: firewallStats.attacks || 0,
         uptime: firewallStats.uptime || 'Unknown'
      });

    } catch (error) {
      toast.error('Failed to communicate with Firewall/Audit API via Quantum Engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLogBadge = (level) => {
     switch (level?.toLowerCase()) {
        case 'error': 
        case 'critical': return <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">CRITICAL</span>;
        case 'warn': 
        case 'warning': return <span className="bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">WARNING</span>;
        default: return <span className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">INFO</span>;
     }
  };

  const columns = [
    { header: 'Event Signature', accessor: 'id', cell: row => <span className="text-[10px] font-mono text-muted-foreground">{row.id}</span> },
    { header: 'Timestamp', accessor: 'timestamp', cell: row => <span className="text-xs font-mono">{new Date(row.timestamp || row.created_at).toLocaleString()}</span> },
    { header: 'Severity', accessor: 'level', cell: row => getLogBadge(row.level) },
    { header: 'Vector Node', accessor: 'source', cell: row => <span className="text-xs font-medium text-[#3b82f6]">{row.source || row.target_type || 'Unknown'}</span> },
    { header: 'Origin IP', accessor: 'ip', cell: row => <span className="text-xs font-mono tracking-widest">{row.ip || row.ip_address || 'N/A'}</span> },
    { header: 'Event Message', accessor: 'message', cell: row => <span className="text-sm">{row.message || row.action}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
           <h3 className="text-2xl font-bold font-heading text-foreground items-center flex">
              <ShieldCheck className="w-6 h-6 mr-3 text-[#10b981]" /> Auditing & System Security
           </h3>
           <p className="text-sm text-muted-foreground mt-1">Live polling of Quantum Direction Engine firewall intercepts and system audit logs.</p>
        </div>
      </div>

      {/* Primary Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#10b981] to-transparent"></div>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center">
                  <Cpu className="w-3 h-3 mr-1" /> Router Traffic
               </p>
               <h3 className="text-2xl font-heading font-bold font-mono text-foreground">{threatMetrics.requests.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#f59e0b] to-transparent"></div>
          <CardContent className="p-5 flex items-center justify-between">
             <div>
               <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1" /> Firewall Blocks
               </p>
               <h3 className="text-2xl font-heading font-bold font-mono text-[#f59e0b]">{threatMetrics.blocks.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#ef4444] to-transparent"></div>
          <CardContent className="p-5 flex items-center justify-between">
             <div>
               <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Prevented Intrusions
               </p>
               <h3 className="text-2xl font-heading font-bold font-mono text-[#ef4444]">{threatMetrics.attacks.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#3b82f6] to-transparent"></div>
          <CardContent className="p-5 flex items-center justify-between">
             <div>
               <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center">
                  <Zap className="w-3 h-3 mr-1" /> Logic Node Uptime
               </p>
               <h3 className="text-2xl font-heading font-bold font-mono text-[#3b82f6]">{threatMetrics.uptime}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="w-full">
         <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-[#141d2e] border border-[#1e2d47]">
            <TabsTrigger value="audit" className="text-xs uppercase tracking-widest"><FileText className="w-3.5 h-3.5 mr-2"/> Audit Ledger</TabsTrigger>
            <TabsTrigger value="firewall" className="text-xs uppercase tracking-widest"><ShieldBan className="w-3.5 h-3.5 mr-2"/> Active Firewall Drops</TabsTrigger>
         </TabsList>

         <div className="mt-6">
            <TabsContent value="audit" className="space-y-6">
               <Card className="border-[#1e2d47]">
                 <CardHeader className="bg-[#141d2e] rounded-t-lg border-b border-[#1e2d47] flex flex-row items-center justify-between">
                   <div>
                     <CardTitle className="text-base flex items-center"><Network className="w-4 h-4 mr-2 text-[#3b82f6]"/> Global Systems Audit Ledger</CardTitle>
                     <CardDescription className="mt-1">Cryptographically immutable ledger of backend API network executions.</CardDescription>
                   </div>
                   <Button variant="outline" size="sm" onClick={fetchData} className="h-8 shadow-sm group">
                      <RotateCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Sync Log Arrays
                   </Button>
                 </CardHeader>
                 <CardContent className="pt-6">
                   <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-border">
                      <div className="flex gap-2">
                         <div className="px-3 py-1 bg-[#10b981]/10 rounded border border-[#10b981]/20 text-[#10b981] text-xs font-mono">{logs.filter(l => l.level==='info').length} Routine Logged</div>
                         <div className="px-3 py-1 bg-[#f59e0b]/10 rounded border border-[#f59e0b]/20 text-[#f59e0b] text-xs font-mono">{logs.filter(l => l.level?.includes('warn')).length} Suspicious</div>
                         <div className="px-3 py-1 bg-[#ef4444]/10 rounded border border-[#ef4444]/20 text-[#ef4444] text-xs font-mono">{logs.filter(l => l.level==='error' || l.level==='critical').length} Critical</div>
                      </div>
                   </div>
                   <DataTable columns={columns} data={logs} pageSize={15} />
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="firewall" className="space-y-6">
               <div className="grid grid-cols-1">
                  {/* Active Banned IPs pulled physically from threat array */}
                  <Card className="border-[#ef4444]/30 bg-[rgba(239,68,68,0.02)] border-t-2 border-t-[#ef4444]">
                     <CardHeader className="pb-3 border-b border-[#ef4444]/10 flex flex-row items-center justify-between">
                        <div>
                        <CardTitle className="text-[#ef4444] text-base flex items-center uppercase tracking-widest font-bold">
                           <ShieldBan className="w-4 h-4 mr-2" /> Live Quarantined IP Arrays
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 text-[#ef4444]/70">Hardware and application-layer banned network nodes.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} className="h-8 shadow-sm group border-[#ef4444]/30 hover:bg-[#ef4444]/10 text-[#ef4444]">
                           <RotateCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Layer 7
                        </Button>
                     </CardHeader>
                     <CardContent className="pt-4 p-0">
                        <div className="flex flex-col">
                           {blockedIPs.map((node, i) => (
                              <div key={i} className="flex justify-between items-center p-4 border-b border-border/50 hover:bg-[#ef4444]/5 transition-colors">
                                 <div>
                                    <div className="text-sm font-mono font-bold tracking-widest text-[#ef4444] flex items-center"><ShieldAlert className="w-3.5 h-3.5 mr-2" />{node.ip || node.ip_address}</div>
                                    <div className="text-xs text-muted-foreground mt-1 ml-5">Reason: {node.reason || 'DDoS Node Vector Threshold Reached'}</div>
                                 </div>
                                 <div className="text-xs text-muted-foreground font-mono text-right">{new Date(node.time || node.created_at).toLocaleString()}</div>
                              </div>
                           ))}
                           {blockedIPs.length === 0 && (
                              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                 <ShieldCheck className="w-10 h-10 mb-2 opacity-30 text-[#10b981]" />
                                 <p className="text-sm font-bold">No active threats detected.</p>
                                 <p className="text-xs mt-1">Routing matrix is optimal.</p>
                              </div>
                           )}
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </TabsContent>
         </div>
      </Tabs>
    </div>
  );
};

export default AdminSystemLogs;
