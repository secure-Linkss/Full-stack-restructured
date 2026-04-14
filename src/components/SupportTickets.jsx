import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, Search, CheckCircle, RefreshCw, Send, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Forms
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'normal' });
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await api.support?.getTickets() || { tickets: [] };
      const data = response.tickets || response || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load support history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) return toast.error('Subject and message required.');
    setSubmitting(true);
    try {
      await api.support.createTicket(newTicket);
      toast.success('Ticket submitted successfully.');
      setIsCreating(false);
      setNewTicket({ subject: '', message: '', priority: 'normal' });
      fetchTickets();
    } catch (error) {
      toast.error('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage) return;
    setSubmitting(true);
    try {
      await api.support.replyToTicket(activeTicket.id, replyMessage);
      toast.success('Reply sent.');
      setReplyMessage('');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !(t.subject || '').toLowerCase().includes(search.toLowerCase()) && !(t.id || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center">
             <MessageSquare className="w-6 h-6 mr-3 text-[#3b82f6]" />
             Support & Communication
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Directly communicate with technical support analysts.</p>
        </div>
        <button onClick={() => { setIsCreating(true); setActiveTicket(null); }} className="btn-primary shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Open New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        {/* Ticket List */}
        <div className="lg:col-span-1 enterprise-card flex flex-col h-full overflow-hidden border-[#1e2d47]/60">
          <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.01)] shrink-0 space-y-3">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search tickets..." 
                 className="enterprise-input pl-9 w-full text-xs h-10"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <div className="flex gap-2">
               <button onClick={() => setFilter('all')} className={`flex-1 text-xs py-1.5 rounded-md font-semibold ${filter === 'all' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-muted-foreground hover:bg-white/5'}`}>All</button>
               <button onClick={() => setFilter('open')} className={`flex-1 text-xs py-1.5 rounded-md font-semibold ${filter === 'open' ? 'bg-[#10b981]/20 text-[#10b981]' : 'text-muted-foreground hover:bg-white/5'}`}>Open</button>
               <button onClick={() => setFilter('resolved')} className={`flex-1 text-xs py-1.5 rounded-md font-semibold ${filter === 'resolved' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'}`}>Resolved</button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin"></div></div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" /> No tickets found.</div>
            ) : (
               filteredTickets.map(ticket => (
                 <button 
                   key={ticket.id} 
                   onClick={() => { setActiveTicket(ticket); setIsCreating(false); }}
                   className={`w-full text-left p-3 mb-2 rounded-lg border transition-all ${activeTicket?.id === ticket.id ? 'bg-[rgba(59,130,246,0.05)] border-[#3b82f6]/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{ticket.id}</span>
                     <span className={`badge-dim-${ticket.status === 'resolved' ? 'green' : 'amber'} text-[9px] px-1.5 py-0`}>{ticket.status}</span>
                   </div>
                   <h4 className="text-sm font-semibold text-foreground truncate mb-2">{ticket.subject}</h4>
                   <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                     <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                     {ticket.priority === 'high' && <span className="text-[#ef4444] font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> HIGH</span>}
                   </div>
                 </button>
               ))
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="lg:col-span-2 enterprise-card flex flex-col h-full overflow-hidden relative border-[#1e2d47]/60">
           {isCreating ? (
              <div className="p-6 h-full flex flex-col animate-fade-in relative z-10">
                 <div className="flex justify-between items-center border-b border-border pb-4 mb-5">
                   <h3 className="text-lg font-heading text-foreground">Submit New Support Ticket</h3>
                   <button onClick={() => setIsCreating(false)} className="p-1.5 hover:bg-white/5 rounded text-muted-foreground"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
                   <div>
                     <label className="text-xs font-semibold text-foreground mb-1.5 block">Subject</label>
                     <input type="text" required value={newTicket.subject} onChange={e=>setNewTicket({...newTicket, subject: e.target.value})} className="enterprise-input w-full text-sm" placeholder="Brief description of the issue" />
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-foreground mb-1.5 block">Priority</label>
                     <select value={newTicket.priority} onChange={e=>setNewTicket({...newTicket, priority: e.target.value})} className="enterprise-input w-full text-sm">
                       <option value="low">Low - General Question</option>
                       <option value="normal">Normal - Standard Support</option>
                       <option value="high">High - System Malfunction / Account Access</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-foreground mb-1.5 block">Detailed Message</label>
                     <textarea required value={newTicket.message} onChange={e=>setNewTicket({...newTicket, message: e.target.value})} className="enterprise-input w-full h-40 text-sm py-3" placeholder="Provide as much context as possible..." />
                   </div>
                   <div className="pt-2">
                     <button type="submit" disabled={submitting} className="btn-primary px-6 shadow-lg">
                       {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Submit Ticket
                     </button>
                   </div>
                 </form>
              </div>
           ) : activeTicket ? (
              <div className="flex flex-col h-full animate-fade-in relative z-10 w-full">
                 <div className="p-5 border-b border-border bg-[rgba(255,255,255,0.01)] shrink-0">
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="text-lg font-heading font-bold text-foreground mb-1">{activeTicket.subject}</h3>
                         <div className="flex gap-3 text-xs text-muted-foreground font-mono">
                            <span>ID: {activeTicket.id}</span>
                            <span>•</span>
                            <span>Created: {new Date(activeTicket.created_at).toLocaleString()}</span>
                         </div>
                       </div>
                       <span className={`badge-dim-${activeTicket.status === 'resolved' ? 'green' : 'amber'}`}>{activeTicket.status.toUpperCase()}</span>
                    </div>
                 </div>
                 
                 {/* Thread area */}
                 <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-6 bg-background/30">
                    {/* Initial Message */}
                    <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded bg-[#3b82f6]/20 flex items-center justify-center shrink-0 border border-[#3b82f6]/40 text-[#3b82f6] font-bold text-xs">Me</div>
                       <div className="bg-[rgba(255,255,255,0.03)] border border-border p-4 rounded-xl rounded-tl-sm w-full">
                         <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{activeTicket._msg || activeTicket.messages?.[0]?.content || "Initial details not fully synchronized in preview."}</p>
                       </div>
                    </div>
                    {/* Admin Reply Mock if array exists */}
                    {(activeTicket.messages || []).slice(1).map((msg, i) => (
                       <div key={i} className="flex items-start gap-4 flex-row-reverse">
                         <div className="w-8 h-8 rounded bg-[#10b981]/20 flex items-center justify-center shrink-0 border border-[#10b981]/40 text-[#10b981]"><ShieldAlert className="w-4 h-4"/></div>
                         <div className="bg-[rgba(16,185,129,0.05)] border border-[#10b981]/20 p-4 rounded-xl rounded-tr-sm w-full">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-[#10b981]">Support Agent</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                         </div>
                       </div>
                    ))}
                 </div>

                 {/* Reply box */}
                 {activeTicket.status !== 'resolved' && (
                   <div className="p-4 border-t border-border bg-[rgba(255,255,255,0.01)] shrink-0">
                     <form onSubmit={handleReply} className="relative">
                        <textarea 
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply to support..."
                          className="enterprise-input w-full pr-16 text-sm py-3 min-h-[60px] max-h-[120px]"
                          disabled={submitting}
                        />
                        <button type="submit" disabled={!replyMessage.trim() || submitting} className="absolute right-3 top-3 p-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors disabled:opacity-50">
                           {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                     </form>
                   </div>
                 )}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-60">
                 <MessageSquare className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                 <h3 className="text-lg font-medium text-foreground">Select a Support Ticket</h3>
                 <p className="text-sm text-muted-foreground mt-1 max-w-sm">Choose a ticket from the sidebar to view the conversation thread, or open a new one.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
