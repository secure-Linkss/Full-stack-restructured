import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar, Link as LinkIcon, Shield, Globe, AlertCircle, Zap, Facebook } from 'lucide-react'
import { toast } from 'sonner'
const CreateLinkModal = ({ open, onOpenChange, onLinkCreated }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    target_url: '',
    campaign_name: '',
    custom_slug: '',
    capture_email: false,
    capture_password: false,
    bot_blocking_enabled: false,
    expires_at: '',
    expiration_action: 'redirect',
    expiration_redirect_url: '',
    facebook_pixel_id: '',
    enable_facebook_pixel: false,
    geo_targeting_enabled: false,
    geo_targeting_type: 'allow',
    allowed_countries: [],
    blocked_countries: []
  })
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.target_url) {
      toast.error('Target URL is required')
      return
    }
    try {
      setLoading(true)
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        const data = await response.json()
        toast.success('Link created successfully!')
        onLinkCreated(data)
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create link')
      }
    } catch (error) {
      console.error('Error creating link:', error)
      toast.error('Failed to create link')
    } finally {
      setLoading(false)
    }
  }
  const resetForm = () => {
    setFormData({
      target_url: '',
      campaign_name: '',
      custom_slug: '',
      capture_email: false,
      capture_password: false,
      bot_blocking_enabled: false,
      expires_at: '',
      expiration_action: 'redirect',
      expiration_redirect_url: '',
      facebook_pixel_id: '',
      enable_facebook_pixel: false,
      geo_targeting_enabled: false,
      geo_targeting_type: 'allow',
      allowed_countries: [],
      blocked_countries: []
    })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-400" />
            Create New Tracking Link
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your tracking link with advanced features
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-slate-700">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="expiration">Expiration</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
            </TabsList>
            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="target_url">Target URL *</Label>
                <Input
                  id="target_url"
                  placeholder="https://example.com"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign_name">Campaign Name</Label>
                <Input
                  id="campaign_name"
                  placeholder="Summer Sale 2024"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_slug">Custom Slug (Optional)</Label>
                <Input
                  id="custom_slug"
                  placeholder="my-campaign"
                  value={formData.custom_slug}
                  onChange={(e) => setFormData({ ...formData, custom_slug: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">Create a memorable branded link (e.g., yourdomain.com/s/my-campaign)</p>
              </div>
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  Custom slugs must be unique and can only contain letters, numbers, and hyphens.
                </AlertDescription>
              </Alert>
            </TabsContent>
            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-semibold">Email Capture</Label>
                  <p className="text-xs text-slate-400">Capture visitor email addresses</p>
                </div>
                <Switch
                  checked={formData.capture_email}
                  onCheckedChange={(checked) => setFormData({ ...formData, capture_email: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-semibold">Password Capture</Label>
                  <p className="text-xs text-slate-400">Capture visitor passwords (use responsibly)</p>
                </div>
                <Switch
                  checked={formData.capture_password}
                  onCheckedChange={(checked) => setFormData({ ...formData, capture_password: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-semibold">Bot Blocking</Label>
                  <p className="text-xs text-slate-400">Block automated bots and crawlers</p>
                </div>
                <Switch
                  checked={formData.bot_blocking_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, bot_blocking_enabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-semibold">Geo-Targeting</Label>
                  <p className="text-xs text-slate-400">Target or block specific countries</p>
                </div>
                <Switch
                  checked={formData.geo_targeting_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, geo_targeting_enabled: checked })}
                />
              </div>
            </TabsContent>
            {/* Expiration Tab */}
            <TabsContent value="expiration" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="expires_at" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date & Time
                </Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">Leave empty for no expiration</p>
              </div>
              {formData.expires_at && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="expiration_action">Action When Expired</Label>
                    <select
                      id="expiration_action"
                      value={formData.expiration_action}
                      onChange={(e) => setFormData({ ...formData, expiration_action: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="redirect">Redirect to URL</option>
                      <option value="message">Show Expiration Message</option>
                      <option value="404">Return 404 Error</option>
                    </select>
                  </div>
                  {formData.expiration_action === 'redirect' && (
                    <div className="space-y-2">
                      <Label htmlFor="expiration_redirect_url">Redirect URL</Label>
                      <Input
                        id="expiration_redirect_url"
                        placeholder="https://example.com/expired"
                        value={formData.expiration_redirect_url}
                        onChange={(e) => setFormData({ ...formData, expiration_redirect_url: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  )}
                </>
              )}
              <Alert className="bg-yellow-900/20 border-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-400">
                  Expired links will automatically stop working at the specified date and time.
                </AlertDescription>
              </Alert>
            </TabsContent>
            {/* Tracking Tab */}
            <TabsContent value="tracking" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <Label className="text-white font-semibold flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook Pixel
                  </Label>
                  <p className="text-xs text-slate-400">Track conversions with Facebook Pixel</p>
                </div>
                <Switch
                  checked={formData.enable_facebook_pixel}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_facebook_pixel: checked })}
                />
              </div>
              {formData.enable_facebook_pixel && (
                <div className="space-y-2">
                  <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                  <Input
                    id="facebook_pixel_id"
                    placeholder="1234567890"
                    value={formData.facebook_pixel_id}
                    onChange={(e) => setFormData({ ...formData, facebook_pixel_id: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">Find your Pixel ID in Facebook Events Manager</p>
                </div>
              )}
              <Alert className="bg-blue-900/20 border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  Facebook Pixel will automatically track PageView events and custom conversions.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default CreateLinkModal
links_updated.py
from flask import Blueprint, request, jsonify, session
from src.models.link import Link
from src.models.user import User, db
from src.models.campaign import Campaign
from src.models.tracking_event import TrackingEvent
from functools import wraps
import json
import string
import random
import requests
from datetime import datetime
links_bp = Blueprint("links", __name__)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user = User.verify_token(token)
            if user:
                session["user_id"] = user.id
                return f(*args, **kwargs)
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function
def generate_short_code(length=8):
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))
def validate_custom_slug(slug):
    """Validate custom slug format"""
    if not slug:
        return True
    import re
    # Only allow alphanumeric characters and hyphens
    if not re.match(r'^[a-zA-Z0-9-]+$', slug):
        return False
    # Check length
    if len(slug) < 3 or len(slug) > 100:
        return False
    return True
@links_bp.route("/links", methods=["GET"])
@login_required
def get_links():
    """Get all links for current user"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        campaign_id = request.args.get("campaign_id", type=int)
        query = Link.query.filter_by(user_id=user_id)
        if campaign_id:
            query = query.filter_by(campaign_id=campaign_id)
        pagination = query.order_by(Link.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        links = [link.to_dict(base_url=request.host_url.rstrip("/")) for link in pagination.items]
        return jsonify({
            "links": links,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links", methods=["POST"])
@login_required
def create_link():
    """Create new tracking link with advanced features"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        if not user.can_create_link():
            return jsonify({"error": "Daily link limit reached"}), 403
        data = request.get_json()
        target_url = data.get("target_url")
        campaign_name = data.get("campaign_name", "Untitled Campaign")
        custom_slug = data.get("custom_slug")
        if not target_url:
            return jsonify({"error": "Target URL required"}), 400
        # Validate custom slug
        if custom_slug:
            if not validate_custom_slug(custom_slug):
                return jsonify({"error": "Invalid custom slug format. Use only letters, numbers, and hyphens (3-100 characters)"}), 400
            # Check if custom slug already exists
            existing = Link.query.filter_by(custom_slug=custom_slug).first()
            if existing:
                return jsonify({"error": "Custom slug already in use"}), 400
        # Parse expiration date
        expires_at = None
        if data.get("expires_at"):
            try:
                expires_at = datetime.fromisoformat(data.get("expires_at").replace('Z', '+00:00'))
            except:
                return jsonify({"error": "Invalid expiration date format"}), 400
        # Auto-create campaign if needed
        if campaign_name and campaign_name != "Untitled Campaign":
            existing_campaign = Campaign.query.filter_by(
                owner_id=user_id,
                name=campaign_name
            ).first()
            if not existing_campaign:
                new_campaign = Campaign(
                    name=campaign_name,
                    description=f"Auto-created for tracking link",
                    owner_id=user_id,
                    status='active'
                )
                db.session.add(new_campaign)
        link = Link(
            user_id=user_id,
            target_url=target_url,
            custom_slug=custom_slug,
            campaign_name=campaign_name,
            capture_email=data.get("capture_email", False),
            capture_password=data.get("capture_password", False),
            bot_blocking_enabled=data.get("bot_blocking_enabled", False),
            geo_targeting_enabled=data.get("geo_targeting_enabled", False),
            geo_targeting_type=data.get("geo_targeting_type", "allow"),
            rate_limiting_enabled=data.get("rate_limiting_enabled", False),
            dynamic_signature_enabled=data.get("dynamic_signature_enabled", False),
            mx_verification_enabled=data.get("mx_verification_enabled", False),
            preview_template_url=data.get("preview_template_url"),
            allowed_countries=json.dumps(data.get("allowed_countries", [])),
            blocked_countries=json.dumps(data.get("blocked_countries", [])),
            allowed_regions=json.dumps(data.get("allowed_regions", [])),
            blocked_regions=json.dumps(data.get("blocked_regions", [])),
            allowed_cities=json.dumps(data.get("allowed_cities", [])),
            blocked_cities=json.dumps(data.get("blocked_cities", [])),
            expires_at=expires_at,
            expiration_action=data.get("expiration_action", "redirect"),
            expiration_redirect_url=data.get("expiration_redirect_url"),
            facebook_pixel_id=data.get("facebook_pixel_id"),
            enable_facebook_pixel=data.get("enable_facebook_pixel", False)
        )
        db.session.add(link)
        user.increment_link_usage()
        db.session.commit()
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["GET"])
@login_required
def get_link(link_id):
    """Get specific link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["PATCH"])
@login_required
def update_link(link_id):
    """Update link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        data = request.get_json()
        if "target_url" in data:
            link.target_url = data["target_url"]
        if "campaign_name" in data:
            link.campaign_name = data["campaign_name"]
        if "status" in data:
            link.status = data["status"]
        if "capture_email" in data:
            link.capture_email = data["capture_email"]
        if "bot_blocking_enabled" in data:
            link.bot_blocking_enabled = data["bot_blocking_enabled"]
        if "custom_slug" in data:
            custom_slug = data["custom_slug"]
            if custom_slug and not validate_custom_slug(custom_slug):
                return jsonify({"error": "Invalid custom slug format"}), 400
            if custom_slug and custom_slug != link.custom_slug:
                existing = Link.query.filter_by(custom_slug=custom_slug).first()
                if existing:
                    return jsonify({"error": "Custom slug already in use"}), 400
            link.custom_slug = custom_slug
        if "expires_at" in data:
            if data["expires_at"]:
                try:
                    link.expires_at = datetime.fromisoformat(data["expires_at"].replace('Z', '+00:00'))
                except:
                    return jsonify({"error": "Invalid expiration date format"}), 400
            else:
                link.expires_at = None
        if "expiration_action" in data:
            link.expiration_action = data["expiration_action"]
        if "expiration_redirect_url" in data:
            link.expiration_redirect_url = data["expiration_redirect_url"]
        if "facebook_pixel_id" in data:
            link.facebook_pixel_id = data["facebook_pixel_id"]
        if "enable_facebook_pixel" in data:
            link.enable_facebook_pixel = data["enable_facebook_pixel"]
        db.session.commit()
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["DELETE"])
@login_required
def delete_link(link_id):
    """Delete link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        db.session.delete(link)
        db.session.commit()
        return jsonify({"message": "Link deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/regenerate/<int:link_id>", methods=["POST"])
@login_required
def regenerate_link(link_id):
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    link = Link.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"success": False, "error": "Link not found or access denied"}), 404
    scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
    base_url = f"{scheme}://{request.host}"
    # Generate new unique short code
    while True:
        new_short_code = generate_short_code()
        existing = Link.query.filter_by(short_code=new_short_code).first()
        if not existing:
            break
    try:
        old_short_code = link.short_code
        link.short_code = new_short_code
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Tracking link regenerated successfully",
            "old_short_code": old_short_code,
            "new_short_code": new_short_code,
            "tracking_url": f"{base_url}/t/{new_short_code}?id={{id}}",
            "pixel_url": f"{base_url}/p/{new_short_code}?email={{email}}&id={{id}}",
            "email_code": f"<img src=\"{base_url}/p/{new_short_code}?email={{email}}&id={{id}}\" width=\"1\" height=\"1\" style=\"display:none;\" />"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to regenerate tracking link"}), 500
@links_bp.route("/links/stats", methods=["GET"])
@login_required
def get_links_stats():
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    try:
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        if not link_ids:
            return jsonify({
                "totalLinks": 0,
                "totalClicks": 0,
                "activeLinks": 0,
                "avgCTR": 0
            })
        total_links = len(user_links)
        active_links = len([link for link in user_links if link.is_active])
        total_clicks = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count()
        avg_ctr = (total_clicks / total_links) if total_links > 0 else 0
        return jsonify({
            "totalLinks": total_links,
            "totalClicks": total_clicks,
            "activeLinks": active_links,
            "avgCTR": round(avg_ctr, 2)
        })
    except Exception as e:
        print(f"Error fetching link stats: {e}")
        return jsonify({
            "totalLinks": 0,
            "totalClicks": 0,
            "activeLinks": 0,
            "avgCTR": 0
        }), 500
@links_bp.route("/links/<int:link_id>/toggle-status", methods=["POST"])
@login_required
def toggle_link_status(link_id):
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    link = Link.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"success": False, "error": "Link not found or access denied"}), 404
    try:
        link.status = "paused" if link.status == "active" else "active"
        db.session.commit()
        return jsonify({
            "success": True,
            "message": f"Link {link.status}",
            "status": link.status
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to toggle link status"}), 500
