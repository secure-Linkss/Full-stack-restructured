import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { 
  Bell, MessageSquare, CheckCircle, AlertCircle, Info, 
  Shield, Link2, CreditCard, TrendingUp, Trash2, Filter,
  Plus, Send, Paperclip, X, Clock, User, RefreshCw, Loader
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { toast } from 'sonner';
import { fetchMockData } from '../services/mockApi';

// --- Helper Components ---

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'security': return <Shield className="h-5 w-5 text-red-500" />;
      case 'link': return <Link2 className="h-5 w-5 text-primary" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'campaign': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'system': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        notification.read
          ? 'bg-muted/30 border-border'
          : 'bg-card-foreground/5 border-primary/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="text-foreground font-medium">{notification.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-2"></div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 border-t border-border pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{new Date(notification.timestamp).toLocaleString()}</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {notification.category}
              </Badge>
            </div>
            <div className="flex gap-2">
              {!notification.read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark Read
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(notification.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const NotificationsAndSupport = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notificationsData, ticketsData] = await Promise.all([
        fetchMockData('getNotifications'),
        fetchMockData('getSupportTickets'),
      ]);
      setNotifications(notificationsData);
      setTickets(ticketsData);
      toast.success('Data refreshed.');
    } catch (error) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Notification Handlers (Mocked) ---
  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success('Marked as read (Mock)');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read (Mock)');
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted (Mock)');
  };

  // --- Ticket Handlers (Mocked) ---
  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      // Mock API call for ticket creation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const createdTicket = {
        id: Date.now(),
        ...newTicket,
        status: 'open',
        messages: [{ sender: 'user', message: newTicket.description, timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };

      setTickets(prev => [createdTicket, ...prev]);
      toast.success('Support ticket created successfully (Mock)');
      setNewTicket({ subject: '', category: 'general', priority: 'medium', description: '' });
      setAttachments([]);
      setCreateTicketOpen(false);
    } catch (error) {
      toast.error('Failed to create ticket (Mock)');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (ticketId) => {
    if (!ticketMessage.trim()) return;

    try {
      setSaving(true);
      // Mock API call for sending message
      await new Promise(resolve => setTimeout(resolve, 300));

      setTickets(prev => prev.map(t => t.id === ticketId ? {
        ...t,
        messages: [...t.messages, { sender: 'user', message: ticketMessage, timestamp: new Date().toISOString() }]
      } : t));
      
      toast.success('Message sent (Mock)');
      setTicketMessage('');
      // Update selected ticket state to show new message
      setSelectedTicket(prev => ({
        ...prev,
        messages: [...prev.messages, { sender: 'user', message: ticketMessage, timestamp: new Date().toISOString() }]
      }));
    } catch (error) {
      toast.error('Failed to send message (Mock)');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = (ticketId) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;

    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
    setSelectedTicket(null);
    toast.success('Ticket closed (Mock)');
  };

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const filteredNotifications = notifications.filter(notif => 
    filterCategory === 'all' || notif.category === filterCategory
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const openTicketCount = tickets.filter(t => t.status === 'open').length;

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-foreground">Loading Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Support"
        description="Manage your notifications and support tickets"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" /> Live Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <MessageSquare className="h-4 w-4 mr-2" /> Support Tickets
            {openTicketCount > 0 && (
              <Badge className="ml-2 bg-green-600 text-white">{openTicketCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Notifications</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="outline"
                    size="sm"
                    disabled={unreadCount === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="link">Link Activity</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">No notifications</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tickets List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Tickets</CardTitle>
                  <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Subject *</Label>
                          <Input
                            placeholder="Brief description of your issue"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select value={newTicket.category} onValueChange={(val) => setNewTicket(prev => ({ ...prev, category: val }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="billing">Billing</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Priority</Label>
                            <Select value={newTicket.priority} onChange={(val) => setNewTicket(prev => ({ ...prev, priority: val }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Description *</Label>
                          <Textarea
                            placeholder="Detailed description of your issue..."
                            rows={5}
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Attachments</Label>
                          <Input type="file" multiple onChange={handleFileAttachment} />
                          <div className="mt-2 space-y-1">
                            {attachments.map((file, index) => (
                              <Badge key={index} variant="secondary" className="mr-2">
                                {file.name}
                                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeAttachment(index)} />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateTicketOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTicket} disabled={saving}>
                          {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                          Submit Ticket
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium truncate">{ticket.subject}</h4>
                        <Badge className={`capitalize ${
                          ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ticket.category} - Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">No support tickets</p>
                    <p className="text-sm mt-1">Create a new one to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Detail */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{selectedTicket ? `Ticket #${selectedTicket.id}` : 'Select a Ticket'}</CardTitle>
              </CardHeader>
              <CardContent className="h-[600px] flex flex-col">
                {selectedTicket ? (
                  <>
                    <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">{selectedTicket.subject}</h3>
                        <p className="text-sm text-muted-foreground">{selectedTicket.category} | Priority: {selectedTicket.priority}</p>
                      </div>
                      {selectedTicket.status === 'open' && (
                        <Button variant="destructive" onClick={() => handleCloseTicket(selectedTicket.id)}>
                          Close Ticket
                        </Button>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4">
                      {selectedTicket.messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                            msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {selectedTicket.status === 'open' && (
                      <div className="border-t border-border pt-4">
                        <Textarea
                          placeholder="Type your reply here..."
                          rows={3}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex justify-end">
                          <Button onClick={() => handleSendMessage(selectedTicket.id)} disabled={saving || !ticketMessage.trim()}>
                            {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            Send Message
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>Select a ticket from the list to view details.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsAndSupport;
