import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Link2, Copy, Trash2, ExternalLink, Loader, RefreshCw, Plus, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

const LinkShortener = () => {
  const [loading, setLoading] = useState(true)
  const [shortLinks, setShortLinks] = useState([])
  const [creating, setCreating] = useState(false)
  const [newLink, setNewLink] = useState({
    url: '',
    custom_slug: ''
  })

  useEffect(() => {
    fetchShortLinks()
  }, [])

  const fetchShortLinks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/shortener/links', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setShortLinks(Array.isArray(data) ? data : data.links || [])
      }
    } catch (error) {
      console.error('Error fetching short links:', error)
      toast.error('Failed to load short links')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShortLink = async () => {
    if (!newLink.url) {
      toast.error('URL is required')
      return
    }

    try {
      setCreating(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/shortener/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLink)
      })

      if (!response.ok) throw new Error('Failed to create short link')
      
      const data = await response.json()
      toast.success('Short link created successfully')
      setNewLink({ url: '', custom_slug: '' })
      fetchShortLinks()
    } catch (error) {
      console.error('Error creating short link:', error)
      toast.error('Failed to create short link')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shortener/links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete link')
      
      toast.success('Link deleted successfully')
      fetchShortLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    }
  }

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Short Links...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Link Shortener</h1>
        <p className="text-slate-400">Create and manage shortened URLs</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Create Short Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Long URL *</Label>
              <Input
                placeholder="https://example.com/very/long/url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Custom Slug (Optional)</Label>
              <Input
                placeholder="my-custom-slug"
                value={newLink.custom_slug}
                onChange={(e) => setNewLink(prev => ({ ...prev, custom_slug: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for auto-generated slug</p>
            </div>

            <Button
              onClick={handleCreateShortLink}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Short Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Short Links</h2>
        <Button onClick={fetchShortLinks} variant="outline" className="bg-slate-800 border-slate-700 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {shortLinks.length > 0 ? (
          shortLinks.map((link) => (
            <Card key={link.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-5 w-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">{link.slug}</h3>
                        <Badge className={link.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{link.original_url}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleCopyLink(link.short_url)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => window.open(link.short_url, '_blank')}
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

                  <div className="flex items-center gap-2">
                    <Input
                      value={link.short_url}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyLink(link.short_url)}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-6 text-sm pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-400">{link.clicks || 0} clicks</span>
                    </div>
                    <span className="text-slate-500">Created: {link.created_at}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Link2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No short links yet</p>
              <p className="text-slate-500 text-sm">Create your first short link above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default LinkShortener