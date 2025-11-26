import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Copy, RefreshCw, Edit, ExternalLink, Link as LinkIcon, Mail, Image } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const EnhancedLinkBox = ({ link, onRegenerate, onEdit, onLinkUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState(link.targetUrl);
  const [isSaving, setIsSaving] = useState(false);

  const trackingUrl = link.trackingUrl || "N/A";
  const pixelUrl = link.pixelUrl || "N/A";
  const emailCode = link.emailCode || "N/A";

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
      // Cancel edit, revert to original URL
      setLandingPageUrl(link.targetUrl);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveLandingPage = async () => {
    setIsSaving(true);
    try {
      // Assuming an API endpoint to update the target URL
      await api.links.updateTargetUrl(link.id, landingPageUrl);
      toast.success('Landing page URL updated successfully!');
      onLinkUpdate({ ...link, targetUrl: landingPageUrl }); // Update parent state
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
        <CardTitle className="text-lg font-bold text-white">{link.campaignName}</CardTitle>
        <div className="flex space-x-2">
          <Button size="icon" variant="outline" onClick={testLink} title="Test Link">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={handleEditToggle} title={isEditing ? "Cancel Edit" : "Edit Landing Page URL"}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={() => onRegenerate(link)} title="Regenerate Link">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Landing Page URL (Editable) */}
        {renderLinkSection(
          'LANDING PAGE URL (EDITABLE)', 
          landingPageUrl, 
          <LinkIcon className="h-4 w-4 text-green-400" />, 
          'Landing Page URL',
          true
        )}

        {/* Tracking URL */}
        {renderLinkSection(
          'TRACKING URL', 
          trackingUrl, 
          <LinkIcon className="h-4 w-4 text-blue-400" />, 
          'Tracking URL'
        )}

        {/* Pixel URL */}
        {renderLinkSection(
          'PIXEL URL', 
          pixelUrl, 
          <Image className="h-4 w-4 text-purple-400" />, 
          'Pixel URL'
        )}

        {/* Email Code */}
        {renderLinkSection(
          'EMAIL CODE', 
          emailCode, 
          <Mail className="h-4 w-4 text-yellow-400" />, 
          'Email Code'
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedLinkBox;
