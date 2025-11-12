import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Plus, Copy, Trash2, Edit, Eye, BarChart3, RefreshCw, AlertCircle, CheckCircle, Loader, Search, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'

const TrackingLinksFinal = () => {
  const [links, setLinks] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    original_url: '',
    campaign_name: '',
    title: '',
    description: ''
  })

  useEffect(() => {
    fetchLinksAndCampaigns()
  }, [])

  const fetchLinksAndCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const [linksRes, campaignsRes] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/campaigns')
      ])

      if (!linksRes.ok) throw new Error('Failed to fetch links')
      
      const linksData = await linksRes.json()
      setLinks(Array.isArray(linksData) ? linksData : linksData.links || [])

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : campaignsData.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    if (!formData.original_url) {
      toast.error('Please enter a URL')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create link')
      
      toast.success('Tracking link created successfully')
      setFormData({ original_url: '', campaign_name: '', title: '', description: '' })
      setCreateDialogOpen(false)
      fetchLinksAndCampaigns()
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
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete link')
      
      toast.success('Link deleted successfully')
      fetchLinksAndCampaigns()
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    }
  }

  const handleCopyLink = (shortLink) => {
    navigator.clipboard.writeText(shortLink)
    toast.success('Link copied to clipboard')
  }

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.original_url?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCampaign = filterCampaign === 'all' || link.campaign_name === filterCampaign
    return matchesSearch && matchesCampaign
  })

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const totalVisitors = links.reduce((sum, link) => sum + (link.real_visitors || 0), 0)
  const totalBotsBlocked = links.reduce((sum, link) => sum + (link.bots_blocked || 0), 0)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen flex items-center justify-center">
          <Loader className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
	        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Tracking Links</h1>
	       <p className="text-slate-400 text-sm sm:text-base">Create and manage your tracking links</p>
      </div>

      {/* Overall Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                      <p className="text-slate-400 text-sm">TOTAL CLICKS</p>
                      <p className="text-3xl font-bold text-blue-400 mt-1">{totalClicks}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500/50" />
              </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                      <p className="text-slate-400 text-sm">REAL VISITORS</p>
                      <p className="text-3xl font-bold text-green-400 mt-1">{totalVisitors}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500/50" />
              </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                      <p className="text-slate-400 text-sm">BOTS BLOCKED</p>
                      <p className="text-3xl font-bold text-red-400 mt-1">{totalBotsBlocked}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500/50" />
              </CardContent>
          </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500 w-full"
            />
          </div>
          <Select value={filterCampaign} onValueChange={setFilterCampaign}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.name}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-white">Create Tracking Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-white">Original URL *</Label>
                <Input
                  placeholder="https://example.com"
                  value={formData.original_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_url: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <Label className="text-white">Campaign Name</Label>
                <Input
                  placeholder="My Campaign"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  placeholder="Link Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Input
                  placeholder="Link description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="bg-slate-700 border-slate-600 text-white">
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <><Loader className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Link'}
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
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left Side: Title, URL, Short Link, Actions */}
                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{link.title || 'Untitled'}</h3>
                            <p className="text-sm text-slate-400 truncate">{link.original_url}</p>
                        </div>
                        <Badge className={`ml-3 flex-shrink-0 ${link.status === 'active' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'}`}>{link.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Short Link</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-slate-700 p-2 rounded text-xs text-slate-300 truncate">
                          {link.short_link || 'N/A'}
                        </code>
                        <Button size="icon" variant="outline" onClick={() => handleCopyLink(link.short_link)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-700">
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                        <BarChart3 className="h-4 w-4 mr-2" />Analytics
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteLink(link.id)} className="flex-1 sm:flex-none bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40">
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </Button>
                    </div>
                  </div>

                  {/* Right Side: Stats */}
                  <div className="flex-shrink-0 w-full sm:w-48 bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <div className="text-center">
                          <p className="text-slate-400 text-sm">CLICKS</p>
                          <p className="text-2xl font-bold text-blue-400">{link.clicks || 0}</p>
                      </div>
                      <div className="text-center">
                          <p className="text-slate-400 text-sm">VISITORS</p>
                          <p className="text-2xl font-bold text-green-400">{link.real_visitors || 0}</p>
                      </div>
                      <div className="text-center">
                          <p className="text-slate-400 text-sm">BOTS BLOCKED</p>
                          <p className="text-2xl font-bold text-red-400">{link.bots_blocked || 0}</p>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <p className="text-slate-400">No tracking links found for the selected criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TrackingLinksFinal