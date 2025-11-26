import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { BarChart3, Plus, Trash2, Edit2, AlertCircle, Loader, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'

const UserCampaignManager = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    description: ''
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCampaigns()
  }, [page, searchQuery])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/user/campaigns', {
        params: {
          page,
          per_page: 10,
          search: searchQuery
        }
      })
      setCampaigns(response.data.campaigns || [])
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdateCampaign = async () => {
    if (!newCampaignData.name.trim()) {
      toast.error('Please enter a campaign name')
      return
    }

    try {
      if (editingCampaignId) {
        // Update existing campaign
        setEditing(true)
        await api.put(`/api/user/campaigns/${editingCampaignId}`, {
          name: newCampaignData.name,
          description: newCampaignData.description
        })
        toast.success('Campaign updated successfully!')
      } else {
        // Create new campaign
        setCreating(true)
        await api.post('/api/user/campaigns', {
          name: newCampaignData.name,
          description: newCampaignData.description
        })
        toast.success('Campaign created successfully!')
      }

      // Reset form
      setNewCampaignData({ name: '', description: '' })
      setEditingCampaignId(null)
      setShowCreateDialog(false)

      // Refresh campaigns list
      await fetchCampaigns()
    } catch (error) {
      console.error('Error creating/updating campaign:', error)
      toast.error(error.response?.data?.error || 'Failed to save campaign')
    } finally {
      setCreating(false)
      setEditing(false)
    }
  }

  const handleEditCampaign = (campaign) => {
    setNewCampaignData({
      name: campaign.name,
      description: campaign.description
    })
    setEditingCampaignId(campaign.id)
    setShowCreateDialog(true)
  }

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/api/user/campaigns/${campaignId}`)
      toast.success('Campaign deleted successfully')
      await fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const handleCloseDialog = () => {
    setShowCreateDialog(false)
    setNewCampaignData({ name: '', description: '' })
    setEditingCampaignId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Campaign Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage your marketing campaigns</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCampaignId ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
              <DialogDescription>
                {editingCampaignId
                  ? 'Update your campaign details'
                  : 'Create a new marketing campaign to organize your links'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Summer Sale 2024"
                  value={newCampaignData.name}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="campaignDescription">Description</Label>
                <Textarea
                  id="campaignDescription"
                  placeholder="Describe your campaign..."
                  value={newCampaignData.description}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleCreateOrUpdateCampaign}
                disabled={creating || editing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creating || editing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {editingCampaignId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          className="flex-1"
        />
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchQuery
                ? 'No campaigns found matching your search.'
                : 'You haven\'t created any campaigns yet. Create one to get started!'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="border border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        campaign.status === 'active'
                          ? 'bg-green-900/30 text-green-400'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Links</p>
                        <p className="text-white font-semibold">{campaign.links_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="text-white font-semibold">{campaign.total_clicks || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="text-white text-xs">{new Date(campaign.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCampaign(campaign)}
                        className="flex-1 bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/30"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="flex-1 bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserCampaignManager
