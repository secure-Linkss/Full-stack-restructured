import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    targetUrl: '',
    previewUrl: '',
    campaignName: '',
    customCode: '',
    // Domain selection
    domain: '',
    // Security Features
    botBlockingEnabled: true,
    rateLimitingEnabled: false,
    dynamicSignatureEnabled: false,
    mxVerificationEnabled: false,
    // Geo Targeting
    geoTargetingEnabled: false,
    geoTargetingMode: 'allow', // 'allow' or 'block'
    allowedCountries: '', // comma-separated codes
    blockedCountries: '', // comma-separated codes
    // Capture Options
    captureEmail: false,
    capturePassword: false,
    // Expiration
    expirationPeriod: 'never',
  });

  useEffect(() => {
    // Fetch domains for selection
    const fetchDomains = async () => {
      try {
        const response = await api.get('/domains');
        if (response.success && response.domains.length > 0) {
          setDomains(response.domains);
          setFormData(prev => ({ ...prev, domain: response.domains[0].name }));
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast.error('Failed to load domains.');
      }
    };
    fetchDomains();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id, checked) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
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
    if (!formData.domain) {
      toast.error('A domain must be selected.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        target_url: formData.targetUrl,
        preview_url: formData.previewUrl || undefined,
        campaign_name: formData.campaignName || undefined,
        short_code: formData.customCode || undefined,
        domain: formData.domain,
        capture_email: formData.captureEmail,
        capture_password: formData.capturePassword,
        bot_blocking_enabled: formData.botBlockingEnabled,
        rate_limiting_enabled: formData.rateLimitingEnabled,
        dynamic_signature_enabled: formData.dynamicSignatureEnabled,
        mx_verification_enabled: formData.mxVerificationEnabled,
        geo_targeting_enabled: formData.geoTargetingEnabled,
        expiration_period: formData.expirationPeriod,
        // Full Geo-targeting fields
        geo_targeting_mode: formData.geoTargetingMode,
        allowed_countries: formData.geoTargetingEnabled && formData.geoTargetingMode === 'allow' ? formData.allowedCountries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : undefined,
        blocked_countries: formData.geoTargetingEnabled && formData.geoTargetingMode === 'block' ? formData.blockedCountries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : undefined,
        // Note: The old project also had cities/regions, but for now, we focus on the core country-level geo-targeting as the most critical part.
      };

      // Determine API endpoint based on type
      const apiPath = type === 'tracking' ? '/links' : '/shorten';
      const response = await api.post(apiPath, payload); 
      
      if (response.success) {
        toast.success('Link created successfully!');
        // Reset form and close modal
        setFormData(prev => ({
          ...prev,
          targetUrl: '',
          previewUrl: '',
          campaignName: '',
          customCode: '',
          botBlockingEnabled: true,
          rateLimitingEnabled: false,
          dynamicSignatureEnabled: false,
          mxVerificationEnabled: false,
          geoTargetingEnabled: false,
          geoTargetingMode: 'allow',
          allowedCountries: '',
          blockedCountries: '',
          captureEmail: false,
          capturePassword: false,
          expirationPeriod: 'never',
        }));
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

		      {/* Domain Selection */}
		      <div>
		        <Label htmlFor="domain" className="text-foreground">Select Domain *</Label>
		        <Select value={formData.domain} onValueChange={(value) => handleSelectChange('domain', value)}>
		          <SelectTrigger id="domain">
		            <SelectValue placeholder="Select a domain" />
		          </SelectTrigger>
		          <SelectContent>
		            {domains.map(d => (
		              <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
		            ))}
		          </SelectContent>
		        </Select>
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
		        <Select value={formData.expirationPeriod} onValueChange={(value) => handleSelectChange('expirationPeriod', value)}>
		          <SelectTrigger id="expirationPeriod">
		            <SelectValue placeholder="Select expiration" />
		          </SelectTrigger>
		          <SelectContent>
		            <SelectItem value="never">Never Expires</SelectItem>
		            <SelectItem value="5hrs">5 Hours</SelectItem>
		            <SelectItem value="10hrs">10 Hours</SelectItem>
		            <SelectItem value="24hrs">24 Hours</SelectItem>
		            <SelectItem value="48hrs">48 Hours</SelectItem>
		            <SelectItem value="72hrs">72 Hours</SelectItem>
		            <SelectItem value="weekly">Weekly</SelectItem>
		            <SelectItem value="monthly">Monthly</SelectItem>
		            <SelectItem value="yearly">Yearly</SelectItem>
		            <SelectItem value="custom">Custom Date</SelectItem>
		          </SelectContent>
		        </Select>
		      </div>

		      {/* Advanced Settings Toggle */}
		      <Button 
		        type="button" 
		        variant="ghost" 
		        className="w-full justify-start text-blue-500 hover:text-blue-400"
		        onClick={() => setShowAdvanced(!showAdvanced)}
		      >
		        {showAdvanced ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
		        {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
		      </Button>

		      {showAdvanced && (
		        <div className="space-y-4 pt-2 border-t border-border">
		          {/* Security Features */}
		          <div className="pt-2">
		            <h3 className="text-lg font-semibold text-foreground">Security Features</h3>
		            <div className="space-y-2 mt-2">
		              {[
		                { id: 'botBlockingEnabled', label: 'Bot Blocking' },
		                { id: 'rateLimitingEnabled', label: 'Rate Limiting' },
		                { id: 'dynamicSignatureEnabled', label: 'Dynamic Signature' },
		                { id: 'mxVerificationEnabled', label: 'MX Verification' },
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

		          {/* Geo Targeting */}
		          <div className="pt-2">
		            <div className="flex items-center justify-between">
		              <h3 className="text-lg font-semibold text-foreground">Geo Targeting</h3>
		              <Checkbox
		                id="geoTargetingEnabled"
		                checked={formData.geoTargetingEnabled}
		                onCheckedChange={(checked) => handleCheckboxChange('geoTargetingEnabled', checked)}
		              />
		            </div>
		            {formData.geoTargetingEnabled && (
		              <div className="space-y-3 mt-3 p-3 border rounded-lg">
		                {/* Mode Selection */}
		                <div>
		                  <Label htmlFor="geoTargetingMode" className="text-foreground">Mode</Label>
		                  <Select value={formData.geoTargetingMode} onValueChange={(value) => handleSelectChange('geoTargetingMode', value)}>
		                    <SelectTrigger id="geoTargetingMode">
		                      <SelectValue placeholder="Select mode" />
		                    </SelectTrigger>
		                    <SelectContent>
		                      <SelectItem value="allow">Allow (Whitelist)</SelectItem>
		                      <SelectItem value="block">Block (Blacklist)</SelectItem>
		                    </SelectContent>
		                  </Select>
		                </div>

		                {/* Countries Input */}
		                <div>
		                  <Label htmlFor="countries" className="text-foreground">
		                    {formData.geoTargetingMode === 'allow' ? 'Allowed Countries' : 'Blocked Countries'} (comma-separated codes, e.g., US, GB)
		                  </Label>
		                  <Input
		                    id={formData.geoTargetingMode === 'allow' ? 'allowedCountries' : 'blockedCountries'}
		                    type="text"
		                    placeholder="e.g., US, CA, MX"
		                    value={formData.geoTargetingMode === 'allow' ? formData.allowedCountries : formData.blockedCountries}
		                    onChange={handleChange}
		                  />
		                </div>
		              </div>
		            )}
		          </div>

		          {/* Capture Options */}
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
		        </div>
		      )}

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
