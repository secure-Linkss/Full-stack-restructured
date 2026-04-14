import React, { useState, useEffect, useCallback } from 'react';
import { Activity, MapPin, Monitor, Smartphone, Tablet, RefreshCw, Search, Clock, Fingerprint, LocateFixed, Eye, X, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const LiveActivity = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [inspectEvent, setInspectEvent] = useState(null);
  const pageSize = 20;

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.liveActivity.getEvents({ page, limit: pageSize });
      const events = response?.events || response || [];
      setActivities(Array.isArray(events) ? events : []);
    } catch (error) {
      console.error('Failed to fetch live activity:', error);
      // Only show toast on first load failure
      if (activities.length === 0) {
        toast.error('Failed to connect to live event stream.');
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const handleRefresh = () => {
    setLoading(true);
    fetchActivities();
    toast.info('Stream refreshed');
  };

  const getDeviceIcon = (device) => {
    const d = (device || '').toLowerCase();
    if (d.includes('iphone') || d.includes('android') || d.includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('on page') || s.includes('on_page')) return 'badge-dim-green';
    if (s.includes('redirected')) return 'badge-dim-blue';
    if (s.includes('open')) return 'badge-dim-amber';
    if (s.includes('blocked')) return 'badge-dim-red';
    return 'badge-dim-blue';
  };

  const normalizeStatus = (status) => {
    if (!status) return 'Unknown';
    const s = status.toLowerCase();
    if (s.includes('on page') || s.includes('on_page')) return 'On Page';
    if (s.includes('redirect')) return 'Redirected';
    if (s.includes('open')) return 'Open';
    if (s.includes('block')) return 'Blocked';
    return status;
  };

  // Client-side filtering
  const filtered = activities.filter(ev => {
    const matchesStatus = filterStatus === 'all' || normalizeStatus(ev.status).toLowerCase().includes(filterStatus);
    const matchesSearch = !searchQuery ||
      (ev.ip_address || '').includes(searchQuery) ||
      (ev.unique_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.location?.country || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedEvents = filtered.slice(0, pageSize);

  // Inspect modal
  const InspectModal = ({ event, onClose }) => {
    if (!event) return null;
    const fields = [
      { label: 'Event ID', value: event.id || event.unique_id },
      { label: 'Timestamp', value: event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A' },
      { label: 'Status', value: normalizeStatus(event.status) },
      { label: 'IP Address', value: event.ip_address || 'N/A' },
      { label: 'Device', value: event.device || event.user_agent || 'N/A' },
      { label: 'Browser', value: event.browser || 'N/A' },
      { label: 'City', value: event.location?.city || event.city || 'N/A' },
      { label: 'Region', value: event.location?.region || event.region || 'N/A' },
      { label: 'Postcode', value: event.location?.postcode || event.postcode || event.zip || 'N/A' },
      { label: 'Country', value: event.location?.country || event.country || 'N/A' },
      { label: 'ISP', value: event.isp || event.location?.isp || 'Unknown' },
      { label: 'Referrer', value: event.referrer || 'Direct' },
      { label: 'Campaign', value: event.campaign_name || event.link_name || 'N/A' },
      { label: 'Captured Email', value: event.captured_email || event.visitor_email || 'None' },
    ];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="enterprise-card w-full max-w-lg mx-4 p-0 relative shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#3b82f6]"></div>
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-sm font-heading font-semibold text-foreground flex items-center">
              <Eye className="w-4 h-4 mr-2 text-[#3b82f6]" /> Event Inspection
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {fields.map((f, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</span>
                <span className="text-sm font-medium text-foreground font-mono">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <button onClick={() => { api.liveActivity.blockIP(event.ip_address); toast.success('IP flagged'); onClose(); }} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Block IP
            </button>
            <button onClick={onClose} className="btn-secondary text-xs px-4 py-1.5">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse-dot mr-3"></span>
            Live Event Monitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time telemetry and advanced routing inspections</p>
        </div>
        <button className="btn-secondary" onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Stream
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: activities.length, color: 'blue' },
          { label: 'On Page', value: activities.filter(e => normalizeStatus(e.status) === 'On Page').length, color: 'green' },
          { label: 'Redirected', value: activities.filter(e => normalizeStatus(e.status) === 'Redirected').length, color: 'amber' },
          { label: 'Blocked', value: activities.filter(e => normalizeStatus(e.status) === 'Blocked').length, color: 'red' }
        ].map((m, i) => (
          <div key={i} className="enterprise-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.label}</p>
              <p className="text-2xl font-heading text-foreground tabular-nums-custom mt-0.5">{m.value}</p>
            </div>
            <div className={`w-2 h-8 rounded-full bg-${m.color === 'green' ? '[#10b981]' : m.color === 'blue' ? '[#3b82f6]' : m.color === 'amber' ? '[#f59e0b]' : '[#ef4444]'} opacity-60`}></div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <input 
            type="text" 
            placeholder="Search by IP, UID, Location..." 
            className="enterprise-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="enterprise-input w-full md:w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-no-repeat bg-[position:right_0.75rem_center]"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All States</option>
            <option value="open">Open</option>
            <option value="redirected">Redirected</option>
            <option value="on page">On Page</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="enterprise-card overflow-hidden w-full relative">
        <div className="absolute top-0 left-0 w-full h-[2px] border-gradient-animated"></div>
        
        <div className="overflow-x-auto p-1">
          <table className="enterprise-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-[15%]">Timestamp & ID</th>
                <th className="w-[20%]">Origin Location</th>
                <th className="w-[20%]">Device & Environment</th>
                <th className="w-[15%] text-center">Connection State</th>
                <th className="w-[15%]">Network Endpoint</th>
                <th className="w-[15%] text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="relative">
              {loading && activities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center opacity-60">
                      <div className="w-10 h-10 border-4 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin mb-4"></div>
                      <p className="text-sm text-muted-foreground">Connecting to event stream...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center">
                      <Activity className="w-10 h-10 text-muted-foreground/30 mb-4" />
                      <p className="text-sm font-medium text-muted-foreground">No events match current filters</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev, i) => {
                  const loc = ev.location || {};
                  const city = loc.city || ev.city || 'Unknown';
                  const region = loc.region || ev.region || '';
                  const postcode = loc.postcode || ev.postcode || ev.zip || '';
                  const country = loc.country || ev.country || '';
                  const status = normalizeStatus(ev.status);
                  
                  return (
                    <tr key={ev.id || i} className="group animate-fade-in" style={{animationDelay: `${i * 0.03}s`}}>
                      <td className="align-top py-4">
                        <div className="flex items-center text-foreground font-medium text-sm">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--:--:--'}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center font-mono">
                          <Fingerprint className="w-3 h-3 mr-1 opacity-60 shrink-0" />
                          {ev.unique_id || ev.id?.substring(0, 12) || 'N/A'}
                        </div>
                      </td>

                      <td className="align-top py-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-[#3b82f6] mr-2 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {city}{region ? `, ${region}` : ''}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {country}{postcode ? ` • ZIP: ` : ''}
                              {postcode && <span className="font-mono">{postcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="align-top py-4">
                        <div className="flex items-center text-sm text-foreground">
                          <span className="text-muted-foreground mr-2 shrink-0">{getDeviceIcon(ev.device || ev.user_agent)}</span>
                          <span className="truncate">{ev.device || ev.user_agent || 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-6 truncate">
                          {ev.browser || ''}
                        </div>
                      </td>

                      <td className="align-top py-4 text-center">
                        <span className={`${getStatusBadgeClass(ev.status)} inline-flex items-center`}>
                          {status === 'On Page' && <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full mr-1.5 animate-pulse inline-block"></span>}
                          {status}
                        </span>
                      </td>

                      <td className="align-top py-4">
                        <div className="flex items-center text-sm font-mono text-foreground">
                          <LocateFixed className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
                          <span className="truncate">{ev.ip_address || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 truncate">
                          ISP: {ev.isp || ev.location?.isp || 'Unknown'}
                        </div>
                        {ev.captured_email && (
                          <div className="text-[11px] text-[#3b82f6] mt-1 font-mono truncate">
                            Email: {ev.captured_email}
                          </div>
                        )}
                      </td>

                      <td className="align-top py-4">
                        <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setInspectEvent(ev)} className="btn-secondary px-2.5 py-1 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground">
            <span>Showing {Math.min(pageSize, paginatedEvents.length)} of {filtered.length} events</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="tabular-nums-custom font-medium">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={paginatedEvents.length < pageSize} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectEvent && <InspectModal event={inspectEvent} onClose={() => setInspectEvent(null)} />}
    </div>
  );
};

export default LiveActivity;