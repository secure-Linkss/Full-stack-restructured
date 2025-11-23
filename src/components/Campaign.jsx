import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import CreateLinkForm from './forms/CreateLink'
import DataTable from './ui/DataTable'
import ActionIconGroup from './ui/ActionIconGroup'
import { LinkDetails } from './TrackingLinks' // Reusing the LinkDetails component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Plus, Trash2, Edit, TrendingUp, Users, MousePointer, Loader, RefreshCw, Eye, ChevronDown, ChevronUp, Link } from 'lucide-react'
import { toast } from 'sonner'

const Campaign = () => {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedCampaignId, setExpandedCampaignId] = useState(null)
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false)
  const [selectedCampaignForLink, setSelectedCampaignForLink] = useState(null)

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    status: 'active',
    target_url: '',
    budget: 0
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
	      const response = await fetch('/api/campaigns', {
	        headers: { 'Authorization': `Bearer ${token}` }
	      })
	
	      if (response.ok) {
	        const data = await response.json()
	        // Assuming the API returns campaigns with a 'links' array
	        setCampaigns(Array.isArray(data) ? data : data.campaigns || [])
	      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      toast.error('Campaign name is required')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCampaign)
      })

      if (!response.ok) throw new Error('Failed to create campaign')
      
      toast.success('Campaign created successfully')
      setNewCampaign({ name: '', description: '', status: 'active', target_url: '', budget: 0 })
      setCreateDialogOpen(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

	  const handleDeleteCampaign = async (campaignId) => {
	    if (!window.confirm('Are you sure you want to delete this campaign?')) return
	
	    try {
	      const token = localStorage.getItem('token')
	      const response = await fetch(`/api/campaigns/${campaignId}`, {
	        method: 'DELETE',
	        headers: { 'Authorization': `Bearer ${token}` }
	      })
	
	      if (!response.ok) throw new Error('Failed to delete campaign')
	      
	      toast.success('Campaign deleted successfully')
	      fetchCampaigns()
	    } catch (error) {
	      console.error('Error deleting campaign:', error)
	      toast.error('Failed to delete campaign')
	    }
	  }

	  const handleCreateLink = (campaign) => {
	    setSelectedCampaignForLink(campaign)
	    setIsCreateLinkModalOpen(true)
	  }

	  const toggleExpand = (campaignId) => {
	    setExpandedCampaignId(expandedCampaignId === campaignId ? null : campaignId)
	  }

	  const linkColumns = [
	    {
	      header: 'Link Name',
	      accessor: 'campaignName',
	      sortable: true,
	      cell: (row) => (
	        <div className="font-medium">
	          {row.campaignName}
	          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
	            row.status === 'active' ? 'bg-green-500/20 text-green-400' :
	            row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
	            'bg-red-500/20 text-red-400'
	          }`}>
	            {row.status}
	          </span>
	        </div>
	      ),
	    },
	    {
	      header: 'Target URL',
	      accessor: 'targetUrl',
	      cell: (row) => <a href={row.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{row.targetUrl}</a>,
	    },
	    {
	      header: 'Clicks',
	      accessor: 'totalClicks',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{row.totalClicks.toLocaleString()}</span>,
	    },
	    {
	      header: 'Actions',
	      id: 'actions',
	      cell: (row) => (
	        <ActionIconGroup
	          actions={[
	            { icon: Edit, label: 'Edit Link', onClick: () => toast.info(`Edit link ${row.id}`) },
	            { icon: Trash2, label: 'Delete Link', onClick: () => toast.info(`Delete link ${row.id}`) },
	          ]}
	        />
	      ),
	    },
	  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Campaigns...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaign Management</h1>
          <p className="text-slate-400">Create and manage your marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCampaigns} variant="outline" className="bg-slate-800 border-slate-700 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
	      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
	            <DialogTrigger asChild>
	              <Button className="bg-blue-600 hover:bg-blue-700">
	                <Plus className="h-4 w-4 mr-2" />
	                Create Campaign
	              </Button>
	            </DialogTrigger>
	            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
	              <DialogHeader>
	                <DialogTitle className="text-white">Create New Campaign</DialogTitle>
	              </DialogHeader>
	              <div className="space-y-4 py-4">
	                <div>
	                  <Label className="text-white">Campaign Name *</Label>
	                  <Input
	                    placeholder="Enter campaign name"
	                    value={newCampaign.name}
	                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
	                    className="bg-slate-700 border-slate-600 text-white"
	                  />
	                </div>
	
	                <div>
	                  <Label className="text-white">Description</Label>
	                  <Textarea
	                    placeholder="Campaign description"
	                    value={newCampaign.description}
	                    onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
	                    className="bg-slate-700 border-slate-600 text-white"
	                  />
	                </div>
	
	                <div>
	                  <Label className="text-white">Target URL</Label>
	                  <Input
	                    placeholder="https://example.com"
	                    value={newCampaign.target_url}
	                    onChange={(e) => setNewCampaign(prev => ({ ...prev, target_url: e.target.value }))}
	                    className="bg-slate-700 border-slate-600 text-white"
	                  />
	                </div>
	
	                <div className="grid grid-cols-2 gap-4">
	                  <div>
	                    <Label className="text-white">Status</Label>
	                    <Select value={newCampaign.status} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, status: value }))}>
	                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
	                        <SelectValue />
	                      </SelectTrigger>
	                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
	                        <SelectItem value="active">Active</SelectItem>
	                        <SelectItem value="paused">Paused</SelectItem>
	                        <SelectItem value="completed">Completed</SelectItem>
	                      </SelectContent>
	                    </Select>
	                  </div>
	
	                  <div>
	                    <Label className="text-white">Budget</Label>
	                    <Input
	                      type="number"
	                      placeholder="0"
	                      value={newCampaign.budget}
	                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
	                      className="bg-slate-700 border-slate-600 text-white"
	                    />
	                  </div>
	                </div>
	              </div>
	              <DialogFooter>
	                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="bg-slate-700 border-slate-600 text-white">
	                  Cancel
	                </Button>
	                <Button onClick={handleCreateCampaign} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
	                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
	                  Create Campaign
	                </Button>
	              </DialogFooter>
	            </DialogContent>
	          </Dialog>
	
	          {/* Create Link Modal for Campaign */}
	          <Dialog open={isCreateLinkModalOpen} onOpenChange={setIsCreateLinkModalOpen}>
	            <DialogContent className="sm:max-w-[600px] bg-card border-border">
	              <DialogHeader>
	                <DialogTitle className="text-foreground">Create New Link for {selectedCampaignForLink?.name}</DialogTitle>
	              </DialogHeader>
	              {selectedCampaignForLink && (
	                <CreateLinkForm 
	                  onClose={() => setIsCreateLinkModalOpen(false)} 
	                  onLinkCreated={() => {
	                    fetchCampaigns(); // Refresh campaigns to see the new link
	                    setIsCreateLinkModalOpen(false);
	                  }} 
	                  type="tracking"
	                  initialData={{ campaignName: selectedCampaignForLink.name }}
	                />
	              )}
	            </DialogContent>
	          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
	            <Card key={campaign.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
	              <CardContent className="p-6">
	                <div className="flex items-start justify-between mb-4">
	                  <div className="flex-1">
	                    <div className="flex items-center gap-3 mb-2">
	                      <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
	                      <Badge className={
	                        campaign.status === 'active' ? 'bg-green-600' :
	                        campaign.status === 'paused' ? 'bg-yellow-600' : 'bg-slate-600'
	                      }>
	                        {campaign.status}
	                      </Badge>
	                    </div>
	                    <p className="text-slate-400 text-sm">{campaign.description || 'No description'}</p>
	                    {campaign.target_url && (
	                      <p className="text-slate-500 text-xs mt-1 truncate">{campaign.target_url}</p>
	                    )}
	                  </div>
	                  <div className="flex gap-2">
	                    <Button
	                      size="icon"
	                      variant="outline"
	                      onClick={() => handleCreateLink(campaign)}
	                      className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/40"
	                      title="Create Link for Campaign"
	                    >
	                      <Link className="h-4 w-4" />
	                    </Button>
	                    <Button
	                      size="icon"
	                      variant="outline"
	                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
	                      title="View Analytics"
	                    >
	                      <Eye className="h-4 w-4" />
	                    </Button>
	                    <Button
	                      size="icon"
	                      variant="outline"
	                      onClick={() => handleDeleteCampaign(campaign.id)}
	                      className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
	                      title="Delete Campaign"
	                    >
	                      <Trash2 className="h-4 w-4" />
	                    </Button>
	                    <Button
	                      size="icon"
	                      variant="outline"
	                      onClick={() => toggleExpand(campaign.id)}
	                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
	                      title={expandedCampaignId === campaign.id ? 'Collapse Links' : 'Expand Links'}
	                    >
	                      {expandedCampaignId === campaign.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
	                    </Button>
	                  </div>
	                </div>
	
	                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
	                  <div className="p-3 rounded-lg bg-slate-700/50">
	                    <div className="flex items-center gap-2 mb-1">
	                      <MousePointer className="h-4 w-4 text-blue-400" />
	                      <span className="text-xs text-slate-400">Clicks</span>
	                    </div>
	                    <p className="text-xl font-bold text-white">{campaign.total_clicks || 0}</p>
	                  </div>
	
	                  <div className="p-3 rounded-lg bg-slate-700/50">
	                    <div className="flex items-center gap-2 mb-1">
	                      <Users className="h-4 w-4 text-green-400" />
	                      <span className="text-xs text-slate-400">Visitors</span>
	                    </div>
	                    <p className="text-xl font-bold text-white">{campaign.unique_visitors || 0}</p>
	                  </div>
	
	                  <div className="p-3 rounded-lg bg-slate-700/50">
	                    <div className="flex items-center gap-2 mb-1">
	                      <TrendingUp className="h-4 w-4 text-purple-400" />
	                      <span className="text-xs text-slate-400">Conversion</span>
	                    </div>
	                    <p className="text-xl font-bold text-white">{campaign.conversion_rate || 0}%</p>
	                  </div>
	
	                  <div className="p-3 rounded-lg bg-slate-700/50">
	                    <div className="flex items-center gap-2 mb-1">
	                      <span className="text-xs text-slate-400">Budget</span>
	                    </div>
	                    <p className="text-xl font-bold text-white">${campaign.budget || 0}</p>
	                  </div>
	                </div>
	
	                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm text-slate-400">
	                  <span>Created: {campaign.created_at}</span>
	                  <span>Links: {campaign.link_count || 0}</span>
	                </div>
	
	                {expandedCampaignId === campaign.id && (
	                  <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
	                    <h4 className="text-lg font-semibold text-white mb-3">Links in Campaign ({campaign.links?.length || 0})</h4>
	                    {campaign.links && campaign.links.length > 0 ? (
	                      <DataTable
	                        columns={linkColumns}
	                        data={campaign.links}
	                        pageSize={5}
	                        expandedContent={(row) => <LinkDetails link={row} handleAction={() => {}} />}
	                      />
	                    ) : (
	                      <p className="text-slate-400 text-sm">No tracking links found for this campaign.</p>
	                    )}
	                  </div>
	                )}
	              </CardContent>
	            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No campaigns yet</p>
              <p className="text-slate-500 text-sm">Create your first campaign to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Campaign