import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle, Loader, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'

const UserApiKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showKey, setShowKey] = useState({})
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: ['read:links', 'read:analytics'],
    expires_in_days: null
  })
  const [createdKey, setCreatedKey] = useState(null)
  const [stats, setStats] = useState({
    total_keys: 0,
    active_keys: 0,
    total_usage: 0
  })

  useEffect(() => {
    fetchApiKeys()
    fetchStats()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/user/api-keys')
      setApiKeys(response.data.api_keys || [])
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/user/api-keys/usage-stats')
      setStats(response.data.stats || {})
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    try {
      setCreating(true)
      const response = await api.post('/api/user/api-keys', {
        name: newKeyData.name,
        permissions: newKeyData.permissions,
        expires_in_days: newKeyData.expires_in_days
      })

      setCreatedKey(response.data.api_key)
      toast.success('API key created successfully!')
      
      // Reset form
      setNewKeyData({
        name: '',
        permissions: ['read:links', 'read:analytics'],
        expires_in_days: null
      })

      // Refresh keys list
      await fetchApiKeys()
      await fetchStats()
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error(error.response?.data?.error || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      await api.post(`/api/user/api-keys/${keyId}/revoke`)
      toast.success('API key revoked successfully')
      await fetchApiKeys()
      await fetchStats()
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error('Failed to revoke API key')
    }
  }

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/api/user/api-keys/${keyId}`)
      toast.success('API key deleted successfully')
      await fetchApiKeys()
      await fetchStats()
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const permissionOptions = [
    { value: 'read:links', label: 'Read Links' },
    { value: 'write:links', label: 'Write Links' },
    { value: 'read:analytics', label: 'Read Analytics' },
    { value: 'read:campaigns', label: 'Read Campaigns' },
    { value: 'write:campaigns', label: 'Write Campaigns' }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total API Keys</p>
                <p className="text-2xl font-bold">{stats.total_keys}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Keys</p>
                <p className="text-2xl font-bold">{stats.active_keys}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{stats.total_usage}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Key Dialog */}
      {createdKey && (
        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400 ml-2">
            <div className="space-y-2">
              <p className="font-semibold">API Key Created Successfully!</p>
              <p className="text-sm">Copy your API key now. You won't be able to see it again!</p>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="text"
                  value={createdKey.key}
                  readOnly
                  className="flex-1 bg-slate-700 border-slate-600 text-white font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(createdKey.key)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedKey(null)}
                className="w-full mt-2"
              >
                Close
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Create New Key Button */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New API Key
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key to access the Brain Link Tracker API
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., My App, Production Key"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                {permissionOptions.map((perm) => (
                  <label key={perm.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyData.permissions.includes(perm.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyData({
                            ...newKeyData,
                            permissions: [...newKeyData.permissions, perm.value]
                          })
                        } else {
                          setNewKeyData({
                            ...newKeyData,
                            permissions: newKeyData.permissions.filter(p => p !== perm.value)
                          })
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expiresIn">Expires In (days) - Leave empty for no expiration</Label>
              <Input
                id="expiresIn"
                type="number"
                min="1"
                placeholder="e.g., 90"
                value={newKeyData.expires_in_days || ''}
                onChange={(e) => setNewKeyData({
                  ...newKeyData,
                  expires_in_days: e.target.value ? parseInt(e.target.value) : null
                })}
              />
            </div>

            <Button
              onClick={handleCreateKey}
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Create API Key
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't created any API keys yet. Create one to get started with the API.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <Card key={key.id} className="border border-slate-700">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{key.name}</p>
                          <p className="text-sm text-muted-foreground">Key: {key.key_prefix}......</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          key.status === 'active'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="text-white">{new Date(key.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Used</p>
                          <p className="text-white">{key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</p>
                        </div>
                        {key.expires_at && (
                          <div>
                            <p className="text-muted-foreground">Expires</p>
                            <p className="text-white">{new Date(key.expires_at).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {key.permissions && key.permissions.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Permissions</p>
                          <div className="flex flex-wrap gap-2">
                            {key.permissions.map((perm) => (
                              <span key={perm} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-slate-700">
                        {key.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevokeKey(key.id)}
                            className="flex-1 bg-orange-900/20 border-orange-700 text-orange-400 hover:bg-orange-900/30"
                          >
                            Revoke
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteKey(key.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation Link */}
      <Alert className="bg-blue-900/20 border-blue-700">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-400 ml-2">
          <p className="font-semibold">API Documentation</p>
          <p className="text-sm mt-1">
            Visit our <a href="/api/docs" className="underline hover:no-underline">API documentation</a> to learn how to use your API keys.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default UserApiKeyManager
