import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Copy, RefreshCw, Edit, ExternalLink, Link as LinkIcon, Mail, Image, MousePointer2, Users, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const EnhancedLinkBox = ({ link, onRegenerate, onEdit, onDelete, onLinkUpdate, isShortener = false }) => {
  // ... (keep logic same)
  const [isEditing, setIsEditing] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState(link.targetUrl);
  const [isSaving, setIsSaving] = useState(false);

  const trackingUrl = link.trackingUrl || "N/A";
  const pixelUrl = link.pixelUrl || "N/A";
  const emailCode = link.emailCode || "N/A";

  // ... (keep helper functions same)
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const testLink = () => {
    if (trackingUrl !== "N/A") {
      window.open(trackingUrl, '_blank');
    } else {
      toast.error("Tracking URL is not available to test.");
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setLandingPageUrl(link.targetUrl);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveLandingPage = async () => {
    setIsSaving(true);
    try {
      await api.links.updateTargetUrl(link.id, landingPageUrl);
      toast.success('Landing page URL updated successfully!');
      onLinkUpdate({ ...link, targetUrl: landingPageUrl });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating landing page URL:', error);
      toast.error(error.response?.data?.error || 'Failed to update landing page URL.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderLinkSection = (title, value, icon, copyType, isEditable = false) => (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium text-slate-400">{title}</span>
      </div>
      <div className="flex items-center space-x-2">
        {isEditable && isEditing ? (
          <Input
            value={landingPageUrl}
            onChange={(e) => setLandingPageUrl(e.target.value)}
            className="flex-1 bg-slate-700 border-slate-600 text-white font-mono text-sm"
          />
        ) : (
          <code className="flex-1 bg-slate-700 p-2 rounded-md text-blue-400 text-xs sm:text-sm break-all">
            {value}
          </code>
        )}
        <Button
          size="icon"
          variant="outline"
          onClick={() => copyToClipboard(value, copyType)}
          className="flex-shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {isEditable && isEditing && (
        <div className="flex justify-end space-x-2 mt-2">
          <Button variant="secondary" size="sm" onClick={handleEditToggle}>Cancel</Button>
          <Button size="sm" onClick={handleSaveLandingPage} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save URL'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-bold text-white">{link.campaignName}</CardTitle>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${link.status === 'active' ? 'bg-green-500/20 text-green-400' :
            link.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
            {link.status || 'active'}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={testLink} title="Test Link">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => onRegenerate(link)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEditToggle}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(link)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Landing Page URL */}
        {renderLinkSection(
          'Target',
          landingPageUrl,
          <LinkIcon className="h-4 w-4 text-slate-500" />,
          'Landing Page URL',
          true
        )}

        {/* Tracking URL */}
        {renderLinkSection(
          'TRACKING URL',
          trackingUrl,
          <LinkIcon className="h-4 w-4 text-slate-500" />,
          'Tracking URL'
        )}

        {/* Pixel URL — hidden for shortener links */}
        {!isShortener && renderLinkSection(
          'PIXEL URL',
          pixelUrl,
          <Image className="h-4 w-4 text-slate-500" />,
          'Pixel URL'
        )}

        {/* Email Code — hidden for shortener links */}
        {!isShortener && renderLinkSection(
          'EMAIL CODE',
          emailCode,
          <Mail className="h-4 w-4 text-slate-500" />,
          'Email Code'
        )}
      </CardContent>
      <CardFooter className="bg-slate-900/50 py-3 px-6 rounded-b-xl border-t border-slate-700 flex justify-between items-center text-sm text-slate-400">
        <div className="flex items-center space-x-2">
          <MousePointer2 className="h-4 w-4" />
          <span>{link.totalClicks || 0} clicks</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{link.realVisitors || 0} visitors</span>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>{link.botsBlocked || 0} Bot protected</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedLinkBox;
