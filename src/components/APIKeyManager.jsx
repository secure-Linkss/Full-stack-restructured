import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Key, Copy, Trash2, RefreshCw, Eye, EyeOff, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const APIKeyManager = () => {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState(365)
  const [createdKey, setCreatedKey] = useState(null)
  const [showKey, setShowKey] = useState({})

  useEffect(() => {
    fetchAPIKeys()
  }, [])

  const fetchAPIKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.api_keys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expires_in_days: newKeyExpiry
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedKey(data.api_key)
        setApiKeys([data.api_key, ...apiKeys])
        setNewKeyName('')
        toast.success('API key created successfully')
      } else {
        toast.error('Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Failed to create API key')
    }
  }

  const deleteAPIKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId))
        toast.success('API key deleted successfully')
      } else {
        toast.error('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const regenerateAPIKey = async (keyId) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${keyId}/regenerate`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedKey(data.api_key)
        setApiKeys(apiKeys.map(key => key.id === keyId ? data.api_key : key))
        toast.success('API key regenerated successfully')
      } else {
        toast.error('Failed to regenerate API key')
      }
    } catch (error) {
      console.error('Error regenerating API key:', error)
      toast.error('Failed to regenerate API key')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-20 bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                API Keys
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Manage API keys for integrating Brain Link Tracker with your applications
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.length === 0 ? (
            <Alert className="bg-slate-700/50 border-slate-600">
              <AlertCircle className="h-4 w-4 text-slate-400" />
              <AlertDescription className="text-slate-300">
                No API keys yet. Create one to start integrating with your applications.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{apiKey.name}</h3>
                        {apiKey.is_active ? (
                          <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-slate-800 px-2 py-1 rounded">
                            {apiKey.key_prefix}...
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(apiKey.key_prefix)}
                            className="h-6 px-2 text-slate-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p>Created: {formatDate(apiKey.created_at)}</p>
                        {apiKey.last_used_at && (
                          <p>Last used: {formatDate(apiKey.last_used_at)}</p>
                        )}
                        {apiKey.expires_at && (
                          <p>Expires: {formatDate(apiKey.expires_at)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateAPIKey(apiKey.id)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAPIKey(apiKey.id)}
                        className="bg-slate-700 border-slate-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Alert className="bg-blue-900/20 border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-400">
              <strong>Important:</strong> Keep your API keys secure. Never share them publicly or commit them to version control.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a new API key for your application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production App, Mobile App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyExpiry">Expires In (days)</Label>
              <Input
                id="keyExpiry"
                type="number"
                min="1"
                max="3650"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(parseInt(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">Leave as 365 for one year expiration</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                createAPIKey()
                setShowCreateDialog(false)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Created Key Dialog */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdKey.key || ''}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(createdKey.key)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  Store this key securely. For security reasons, we can't show it to you again.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setCreatedKey(null)}
              className="bg-green-600 hover:bg-green-700"
            >
              I've Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default APIKeyManager