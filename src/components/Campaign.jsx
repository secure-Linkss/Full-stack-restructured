import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  TrendingUp,
  Target,
  Users,
  MousePointer,
  Mail,
  RefreshCw,
  Download
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const Campaign = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    targetUrl: '',
    status: 'active'
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCampaign)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setNewCampaign({
          name: '',
          description: '',
          targetUrl: '',
          status: 'active'
        })
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const toggleCampaignStatus = async (campaignId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
    }
  }

  const deleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const handleRefresh = () => {
    fetchCampaigns()
  }

  const handleExport = () => {
    const csvData = [
      ['Campaign', 'Status', 'Clicks', 'Conversions', 'Rate'],
      ...campaigns.map(c => [c.name, c.status, c.clicks, c.conversions, `${c.conversion_rate}%`])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaign Management</h1>
          <p className="text-slate-400">Create and manage your marketing campaigns</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Campaign</DialogTitle>
              <DialogDescription className="text-slate-400">
                Set up a new tracking campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Campaign Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter campaign name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Describe your campaign"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUrl" className="text-white">Target URL</Label>
                <Input
                  id="targetUrl"
                  type="url"
                  value={newCampaign.targetUrl}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetUrl: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="border-slate-600">
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700">
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Campaign Summary Cards - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Total Campaigns</p>
                <p className="text-3xl font-bold text-white">{campaigns.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-white">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <Play className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <MousePointer className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Avg. Conversion</p>
                <p className="text-3xl font-bold text-white">
                  {campaigns.length > 0 
                    ? (campaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / campaigns.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Campaigns</CardTitle>
          <CardDescription>Manage and monitor your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mobile responsive layout wrapper */}
            <div className="grid grid-cols-1 gap-4">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{campaign.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                        className="border-slate-600"
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Stats - Mobile: 2 cols, Tablet: 4 cols */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Clicks</p>
                      <p className="text-xl font-bold text-white">{campaign.clicks || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Visitors</p>
                      <p className="text-xl font-bold text-white">{campaign.visitors || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Conversions</p>
                      <p className="text-xl font-bold text-white">{campaign.conversions || 0}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded">
                      <p className="text-xs text-slate-400 mb-1">Conv. Rate</p>
                      <p className="text-xl font-bold text-white">{campaign.conversion_rate || 0}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Performance</span>
                      <span>{campaign.conversion_rate || 0}%</span>
                    </div>
                    <Progress value={campaign.conversion_rate || 0} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
                <p className="text-slate-400 mb-4">Create your first campaign to start tracking</p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Campaign
