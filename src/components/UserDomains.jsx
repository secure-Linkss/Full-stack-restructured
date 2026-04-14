import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle, RefreshCw, Server, AlertTriangle, Activity, Settings2, ShieldCheck, HeartPulse, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const UserDomains = () => {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [healthCheckingId, setHealthCheckingId] = useState(null);

  const DOMAIN_LIMIT = 10;

  const fetchDomains = async () => {
    try {
      const response = await api.domains.getAll();
      const list = response?.domains || response || [];
      const parsedList = Array.isArray(list) ? list : [];
      setDomains(parsedList);
    } catch (error) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDomains(); }, []);

  const handleAddDomain = async () => {
    if (domains.length >= DOMAIN_LIMIT) return toast.error(`You have reached the maximum limit of ${DOMAIN_LIMIT} custom domains.`);
    if (!newDomain || !newDomain.includes('.')) return toast.error('Enter a valid domain name (e.g. click.yourbrand.com)');
    
    setAdding(true);
    try {
      await api.domains.add({ domain: newDomain });
      toast.success(`Domain ${newDomain} added. Please configure DNS.`);
      setNewDomain('');
      fetchDomains();
    } catch (error) {
      toast.error(`Failed to add domain: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name}? Existing tracking links will break permanently.`)) return;
    try {
      await api.domains.delete(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      toast.success(`Domain ${name} removed.`);
    } catch (error) {
      toast.error(`Failed to remove domain: ${error.message}`);
    }
  };

  const verifyDns = async (id, name) => {
    setVerifyingId(id);
    toast.info(`Verifying DNS for ${name}...`);
    try {
      await api.domains.verify(id);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'Verified' } : d));
      toast.success(`Domain ${name} verified!`);
    } catch (error) {
      toast.error(`DNS verification failed: ${error.message}`);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'Failed' } : d));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleHealthCheck = async (id, name) => {
    setHealthCheckingId(id);
    try {
      await api.domains.healthCheck(id);
      setDomains(prev => prev.map(d => d.id === id ? { ...d, last_checked: new Date().toISOString() } : d));
      toast.success(`${name} backend routing is optimal.`);
    } catch (error) {
      toast.error(`${name} is failing health checks!`);
    } finally {
      setHealthCheckingId(null);
    }
  };

  const handleSetDefault = async (id, name) => {
    try {
      await api.domains.setDefault(id);
      setDomains(prev => prev.map(d => ({ ...d, is_default: d.id === id })));
      toast.success(`${name} set as default domain.`);
    } catch (error) {
      toast.error(`Failed to set default: ${error.message}`);
    }
  };

  const formatStatus = (s) => (s || 'Pending').toString().toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Configuration Pane */}
        <div className="lg:col-span-1 space-y-6">
          <div className="enterprise-card p-5">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-[#3b82f6]" /> 
                <h3 className="text-sm font-semibold text-foreground">Custom Domains</h3>
              </div>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${domains.length >= DOMAIN_LIMIT ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#10b981]/20 text-[#10b981]'}`}>
                {domains.length} / {DOMAIN_LIMIT} Used
              </span>
            </div>
            
            {/* DNS Instructions */}
            <div className="bg-[rgba(59,130,246,0.05)] border border-[#3b82f6]/20 p-3 rounded-md mb-5 space-y-3">
              <div>
                 <p className="text-xs font-semibold text-[#3b82f6] mb-1 flex items-center"><Settings2 className="w-3.5 h-3.5 mr-1" /> DNS CNAME Record</p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Point a CNAME record from your domain to <code className="text-[#f0f4ff] font-mono bg-[#1a2333] px-1.5 py-0.5 rounded">route.brainlink.to</code>
                 </p>
              </div>
              <div className="border-t border-blue-500/10 pt-2">
                 <p className="text-xs font-semibold text-[#3b82f6] mb-1 flex items-center"><Server className="w-3.5 h-3.5 mr-1" /> Apex A Record</p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   If routing the root domain, use an A Record pointing to <code className="text-[#f0f4ff] font-mono bg-[#1a2333] px-1.5 py-0.5 rounded">104.21.XX.XX</code>
                 </p>
              </div>
            </div>

            <label className="text-xs font-medium text-foreground mb-1.5 block">Add Domain Hostname</label>
            <input 
              type="text" 
              placeholder="e.g. click.yourbrand.com" 
              className="enterprise-input text-xs font-mono mb-4"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
              disabled={domains.length >= DOMAIN_LIMIT}
            />
            <button onClick={handleAddDomain} disabled={adding || domains.length >= DOMAIN_LIMIT} className="btn-primary w-full shadow-lg text-xs">
              {adding ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
              {domains.length >= DOMAIN_LIMIT ? 'Limit Reached' : 'Connect Domain'}
            </button>
          </div>
        </div>

        {/* Domains List Data Grid */}
        <div className="lg:col-span-2">
          <div className="enterprise-card h-full w-full relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.01)] flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest">Configured Hostnames</h3>
              <button className="btn-secondary px-2 text-xs" onClick={fetchDomains}>
                <RefreshCw className="w-3 h-3 mr-1" /> Sync
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1 p-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="enterprise-table w-full">
                  <thead>
                    <tr>
                      <th className="w-[30%]">Hostname / Usage</th>
                      <th className="w-[25%] text-center">DNS Status</th>
                      <th className="w-[45%] text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map(domain => {
                      const status = formatStatus(domain.status);
                      const isVerified = status === 'verified';
                      const isFailed = status === 'failed';
                      const isDisabled = status === 'disabled';
                      
                      return (
                        <tr key={domain.id} className="group transition-colors hover:bg-white/[0.02]">
                          <td className="py-4 align-top">
                            <div className="flex items-center">
                              <Globe className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              <span className="font-mono text-sm font-semibold text-foreground pr-2">{domain.name || domain.domain}</span>
                              {domain.is_default && <span className="badge-dim-blue text-[8px] tracking-wider ml-1">DEFAULT</span>}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center mt-1.5 ml-5">
                              <Activity className="w-3 h-3 mr-1" />
                              <span>{domain.usage_count || 0} Links Active</span>
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-1 ml-5 opacity-60">
                              Checked: {domain.last_checked ? new Date(domain.last_checked).toLocaleString() : 'Never'}
                            </div>
                          </td>
                          <td className="py-4 align-top text-center pt-5">
                            <div className={`badge-dim-${isVerified ? 'green' : isFailed ? 'red' : isDisabled ? 'blue' : 'amber'} inline-flex items-center mx-auto`}>
                              {isVerified ? <ShieldCheck className="w-3 h-3 mr-1" /> : isFailed ? <XCircle className="w-3 h-3 mr-1" /> : isDisabled ? <Settings2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" />}
                              <span className="capitalize">{status}</span>
                            </div>
                          </td>
                          <td className="py-4 align-top text-right">
                             <div className="flex items-center justify-end gap-1 px-1 flex-wrap">
                                {isVerified && !domain.is_default && (
                                   <button onClick={() => handleSetDefault(domain.id, domain.name || domain.domain)} className="px-2 py-1.5 rounded-md text-[10px] uppercase font-bold text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all m-0.5">
                                      Set Default
                                   </button>
                                )}
                                {!isVerified && (
                                   <button onClick={() => verifyDns(domain.id, domain.name || domain.domain)} disabled={verifyingId === domain.id} className="px-2 py-1.5 rounded-md text-[10px] uppercase font-bold text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all m-0.5 flex items-center">
                                      {verifyingId === domain.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Verify DNS'}
                                   </button>
                                )}
                                <button onClick={() => handleHealthCheck(domain.id, domain.name || domain.domain)} disabled={healthCheckingId === domain.id} className="px-2 py-1.5 rounded-md text-[10px] uppercase font-bold text-green-400 hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-all m-0.5 flex items-center" title="Force Health Check">
                                   {healthCheckingId === domain.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <HeartPulse className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => handleRemove(domain.id, domain.name || domain.domain)} className="p-1.5 ml-1 rounded-md text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors" title="Delete Domain from Workspace">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                    {domains.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-16">
                          <div className="flex flex-col items-center justify-center opacity-50">
                             <Globe className="w-10 h-10 mb-3" />
                             <p className="text-sm font-semibold">No custom domains configured.</p>
                             <p className="text-xs mt-1">Bind your first root or subdomain to start routing links.</p>
                          </div>
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

export default UserDomains;
