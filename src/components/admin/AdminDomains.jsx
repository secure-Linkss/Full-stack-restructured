import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle, ShieldAlert, RefreshCw, Server, Activity } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const AdminDomains = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchDomains = async () => {
    try {
      const response = await api.adminSettings.getDomains();
      const list = response?.domains || response || [];
      
      // Fetch deep usage stats for each domain concurrently
      const mappedList = await Promise.all((Array.isArray(list) ? list : []).map(async (domain) => {
         try {
            const usageData = await api.domains.getUsage(domain.id);
            return { ...domain, ...usageData };
         } catch {
            return domain;
         }
      }));

      setDomains(mappedList);
    } catch (error) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load global domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDomains(); }, []);

  const handleAddDomain = async () => {
    if (!newDomain || !newDomain.includes('.')) return toast.error('Enter a valid FQDN / Hostname');
    setAdding(true);
    try {
      await api.adminSettings.addDomain({ domain: newDomain });
      toast.success(`Globally integrated domain: ${newDomain}`);
      setNewDomain('');
      fetchData();
    } catch (error) {
      toast.error(`Failed to execute Add Node: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`PERMANENTLY remove ${name} from the global routing pool? Active short URLs will break!`)) return;
    try {
      await api.adminSettings.deleteDomain(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      toast.success(`Domain ${name} nuked from pool.`);
    } catch (error) {
      toast.error(`Failed to purge domain: ${error.message}`);
    }
  };

  const handleToggleState = async (id, currentStatus, name) => {
    const newState = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      await api.adminSettings.updateDomain(id, { status: newState });
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: newState } : d));
      toast.success(`Global Router ${name} is now ${newState.toUpperCase()}`);
    } catch (error) {
       toast.error(`Failed to flip switch: ${error.message}`);
    }
  };

  const handleVerify = async (id, name) => {
    toast.promise(api.domains.verify(id), {
      loading: `Running DNS Verification against ${name}...`,
      success: () => {
        fetchDomains();
        return `${name} propagated and verified.`;
      },
      error: 'DNS Verification Failed. Check NS/A Records.'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-heading text-foreground flex items-center">
           <Globe className="w-6 h-6 mr-3 text-[#3b82f6]" /> Global Domain Management
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Administer the array of root endpoints available for users to route masking URLs through.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-1">
          <div className="enterprise-card p-5 sticky top-6">
            <div className="border-b border-border pb-3 mb-4 flex items-center">
              <Server className="w-4 h-4 mr-2 text-[#3b82f6]" /> 
              <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">Add Routing Core</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              Integrate custom domains that bypass network ad-blockers. These populate the dropdowns universally.
            </p>
            <label className="text-xs font-medium text-foreground mb-1.5 block uppercase tracking-wider text-[#3b82f6]">FQDN / Hostname</label>
            <input 
              type="text" 
              placeholder="e.g. tracking.yourbrand.com" 
              className="enterprise-input font-mono mb-4 focus:border-[#3b82f6]"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
            />
            <button onClick={handleAddDomain} disabled={adding} className="btn-primary w-full shadow-lg">
              {adding ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Integrate Domain Node
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="enterprise-card h-full w-full relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.01)] flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Active Routing Pool</h3>
              <div className="flex items-center gap-2">
                <span className="badge-dim-blue">{domains.length} Active Nodes</span>
                <button onClick={fetchDomains} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto flex-1 p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="enterprise-table w-full">
                  <thead>
                    <tr>
                      <th className="w-[30%]">Hostname Network</th>
                      <th className="w-[20%] text-center">DNS Status</th>
                      <th className="w-[25%] text-center">Telemetry Load</th>
                      <th className="w-[25%] text-right">Node Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map(domain => {
                      const status = domain.status || domain.dns_status || 'active';
                      return (
                        <tr key={domain.id} className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="py-4">
                            <div className="flex items-center">
                              <Globe className="w-4 h-4 mr-2 text-[#3b82f6]" />
                              <span className="font-mono text-sm text-foreground">{domain.name || domain.domain}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 ml-6 uppercase tracking-widest">Id: {domain.id}</p>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest flex items-center justify-center w-max mx-auto ${status === 'active' || status === 'verified' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : status === 'disabled' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 animate-pulse'}`}>
                              {status === 'active' || status === 'verified' ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <ShieldAlert className="w-3 h-3 mr-1.5" />}
                              {status}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col items-center">
                               <div className="flex items-center justify-center gap-2 mb-1">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span className="tabular-nums-custom font-bold text-foreground">{domain.active_links || domain.users || 0}</span>
                               </div>
                               <span className="text-[9px] uppercase tracking-widest text-[#3b82f6]">Active Routing Links</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end items-center gap-2 pr-2">
                              {status !== 'verified' && status !== 'active' && status !== 'disabled' && (
                                 <button onClick={() => handleVerify(domain.id, domain.name || domain.domain)} className="p-1.5 bg-[#f59e0b]/10 rounded border border-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-white transition-all text-[10px] uppercase font-bold tracking-wide">
                                    Verify DNS
                                 </button>
                              )}
                              <button onClick={() => handleToggleState(domain.id, status, domain.name || domain.domain)} className={`p-1.5 rounded border border-transparent transition-all text-[10px] uppercase font-bold tracking-wide ${status === 'disabled' ? 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white'}`}>
                                 {status === 'disabled' ? 'Enable' : 'Disable'}
                              </button>
                              <button onClick={() => handleRemove(domain.id, domain.name || domain.domain)} className="p-2 ml-1 rounded-md hover:bg-[#ef4444]/10 text-muted-foreground hover:text-[#ef4444] border border-transparent hover:border-[#ef4444]/20 transition-colors" title="Purge FQDN / Cleanse Blacklist Node">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {domains.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-16">
                          <Globe className="w-10 h-10 mx-auto mb-4 text-[#3b82f6]/30 animate-pulse" />
                          <p className="text-sm font-semibold text-muted-foreground">No custom subnets established.</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Integrate a routing core to bypass browser blocks.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDomains;
