import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { 
  Bell, MessageSquare, CheckCircle, AlertCircle, Info, 
  Shield, Link2, CreditCard, TrendingUp, Trash2, Filter,
  Plus, Send, Paperclip, X, Clock, User, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('notifications')
  const [notifications, setNotifications] = useState([])
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [createTicketOpen, setCreateTicketOpen] = useState(false)
  const [ticketMessage, setTicketMessage] = useState('')
  const [attachments, setAttachments] = useState([])

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const [notificationsRes, ticketsRes] = await Promise.all([
        fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/tickets', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        setNotifications(Array.isArray(data) ? data : data.notifications || [])
      }

      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(Array.isArray(data) ? data : data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to mark as read')
      
      toast.success('Marked as read')
      fetchData()
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to mark all as read')
      
      toast.success('All notifications marked as read')
      fetchData()
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete notification')
      
      toast.success('Notification deleted')
      fetchData()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('subject', newTicket.subject)
      formData.append('category', newTicket.category)
      formData.append('priority', newTicket.priority)
      formData.append('description', newTicket.description)

      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error('Failed to create ticket')
      
      toast.success('Support ticket created successfully')
      setNewTicket({ subject: '', category: 'general', priority: 'medium', description: '' })
      setAttachments([])
      setCreateTicketOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket')
    }
  }

  const handleSendMessage = async (ticketId) => {
    if (!ticketMessage.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: ticketMessage })
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      toast.success('Message sent')
      setTicketMessage('')
      fetchData()
      
      // Refresh selected ticket
      const ticketRes = await fetch(`/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (ticketRes.ok) {
        const data = await ticketRes.json()
        setSelectedTicket(data)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to close ticket')
      
      toast.success('Ticket closed')
      setSelectedTicket(null)
      fetchData()
    } catch (error) {
      console.error('Error closing ticket:', error)
      toast.error('Failed to close ticket')
    }
  }

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files)
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'security': return <Shield className="h-5 w-5 text-red-400" />
      case 'link': return <Link2 className="h-5 w-5 text-blue-400" />
      case 'payment': return <CreditCard className="h-5 w-5 text-green-400" />
      case 'campaign': return <TrendingUp className="h-5 w-5 text-purple-400" />
      default: return <Info className="h-5 w-5 text-slate-400" />
    }
  }

  const filteredNotifications = notifications.filter(notif => 
    filterCategory === 'all' || notif.category === filterCategory
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Notifications & Support</h1>
        <p className="text-slate-400">Manage your notifications and support tickets</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-slate-800 border border-slate-700">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Bell className="h-4 w-4 mr-2" /> Live Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">{notifications.filter(n => !n.read).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <MessageSquare className="h-4 w-4 mr-2" /> Support Tickets
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <Badge className="ml-2 bg-green-600 text-white">{tickets.filter(t => t.status === 'open').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Live Notifications</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="outline"
                    size="sm"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
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
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
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
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notif.read
                          ? 'bg-slate-700/30 border-slate-600'
                          : 'bg-slate-700 border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notif.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{notif.title}</h4>
                              <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{notif.timestamp}</span>
                              <Badge variant="outline" className="text-xs">
                                {notif.category}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {!notif.read && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No notifications</p>
                    <p className="text-slate-500 text-sm mt-1">You're all caught up!</p>
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
            <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Your Tickets</CardTitle>
                  <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label className="text-white">Subject *</Label>
                          <Input
                            placeholder="Brief description of your issue"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Category</Label>
                            <Select
                              value={newTicket.category}
                              onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="billing">Billing</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                                <SelectItem value="bug">Bug Report</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-white">Priority</Label>
                            <Select
                              value={newTicket.priority}
                              onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Description *</Label>
                          <Textarea
                            placeholder="Provide detailed information about your issue"
                            value={newTicket.description}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Attachments</Label>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileAttachment}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                          {attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                                  <span className="text-sm text-white truncate">{file.name}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeAttachment(index)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setCreateTicketOpen(false)}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTicket}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Create Ticket
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    } border`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate flex-1">{ticket.subject}</h4>
                      <Badge
                        className={`ml-2 text-xs ${
                          ticket.status === 'open'
                            ? 'bg-green-600'
                            : ticket.status === 'pending'
                            ? 'bg-yellow-600'
                            : 'bg-slate-600'
                        }`}
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{ticket.created_at}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {ticket.category}
                      </Badge>
                    </div>
                  </div>
                ))}

                {tickets.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tickets yet</p>
                    <p className="text-slate-500 text-sm mt-1">Create your first support ticket</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Chat */}
            <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
              <CardHeader>
                {selectedTicket ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedTicket.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs">{selectedTicket.category}</Badge>
                        <Badge className="text-xs">{selectedTicket.priority} priority</Badge>
                        <Badge className={`text-xs ${
                          selectedTicket.status === 'open' ? 'bg-green-600' : 'bg-slate-600'
                        }`}>
                          {selectedTicket.status}
                        </Badge>
                      </div>
                    </div>
                    {selectedTicket.status === 'open' && (
                      <Button
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                        variant="outline"
                        size="sm"
                        className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                      >
                        Close Ticket
                      </Button>
                    )}
                  </div>
                ) : (
                  <CardTitle className="text-white">Select a ticket</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {selectedTicket ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-slate-900 rounded-lg">
                      {selectedTicket.messages?.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.is_admin
                                ? 'bg-slate-700 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                {msg.is_admin ? 'Support Team' : 'You'}
                              </span>
                              <span className="text-xs opacity-70">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    {selectedTicket.status === 'open' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(selectedTicket.id)}
                          className="flex-1 bg-slate-700 border-slate-600 text-white"
                        />
                        <Button
                          onClick={() => handleSendMessage(selectedTicket.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Select a ticket to view conversation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Notifications