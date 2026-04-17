import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Shield, Flame, Info, Radio } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DialogFooter } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import api from '../../services/api'; // Assuming api service is available at this path

const CreateLinkForm = ({ onClose, onLinkCreated, type = 'tracking', editingLink = null }) => {
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
    // Email Merge Tag
    subscriberIdEnabled: false,
    // Channel Adaptive Mode™
    channelType: 'general',
    // Zero-Knowledge
    zeroKnowledgeEnabled: false,
    // Burner Links (Expiration)
    expirationPeriod: 'never',
    expireAfterClicks: '',
  });

  useEffect(() => {
    // Fetch domains for selection
    const fetchDomains = async () => {
      try {
        const response = await api.domains.getAll();
        if (response.success && response.domains.length > 0) {
          setDomains(response.domains);
          if (!editingLink) {
             setFormData(prev => ({ ...prev, domain: response.domains[0].name }));
          }
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast.error('Failed to load domains.');
      }
    };
    fetchDomains();

    if (editingLink) {
       setFormData(prev => ({
          ...prev,
          targetUrl: editingLink.targetUrl || editingLink.original_url || editingLink.target_url || '',
          previewUrl: editingLink.preview_url || '',
          campaignName: editingLink.campaignName || editingLink.campaign_name || '',
          customCode: editingLink.custom_slug || editingLink.short_code || '',
          domain: editingLink.domain || '',
          botBlockingEnabled: editingLink.bot_blocking_enabled ?? true,
          rateLimitingEnabled: editingLink.rate_limiting_enabled ?? false,
          dynamicSignatureEnabled: editingLink.dynamic_signature_enabled ?? false,
          mxVerificationEnabled: editingLink.mx_verification_enabled ?? false,
          geoTargetingEnabled: editingLink.geo_targeting_enabled ?? false,
          geoTargetingMode: editingLink.geo_targeting_mode || 'allow',
          allowedCountries: editingLink.allowed_countries ? editingLink.allowed_countries.join(',') : '',
          blockedCountries: editingLink.blocked_countries ? editingLink.blocked_countries.join(',') : '',
          captureEmail: editingLink.capture_email ?? false,
          subscriberIdEnabled: editingLink.subscriber_id_enabled ?? false,
          channelType: editingLink.channel_type || 'general',
          zeroKnowledgeEnabled: editingLink.zero_knowledge_enabled ?? false,
          expirationPeriod: editingLink.expiration_period || 'never',
          expireAfterClicks: editingLink.expire_after_clicks || '',
       }));
       if (editingLink.bot_blocking_enabled !== undefined || editingLink.zero_knowledge_enabled) setShowAdvanced(true);
    }
  }, [editingLink]);

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
        subscriber_id_enabled: formData.subscriberIdEnabled,
        channel_type: formData.channelType,
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
        zero_knowledge_enabled: formData.zeroKnowledgeEnabled,
        expire_after_clicks: formData.expireAfterClicks ? parseInt(formData.expireAfterClicks) : undefined,
      };

      // Determine API endpoint based on type
      let response;
      if (editingLink) {
         response = await api.links.update(editingLink.id, payload);
      } else {
         response = await (type === 'tracking' ? api.links.create(payload) : api.shortener.shorten(formData.targetUrl, payload)); 
      }
      
      if (response && (response.success || response.id || response.tracking_url)) {
        toast.success(`Link ${editingLink ? 'updated' : 'created'} successfully!`);
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
          subscriberIdEnabled: false,
          channelType: 'general',
          zeroKnowledgeEnabled: false,
          expirationPeriod: 'never',
          expireAfterClicks: '',
        }));
        onLinkCreated(response.link || response.data || payload);
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
		        <Label htmlFor="domain" className="text-foreground flex items-center justify-between">
		           <span>Select Domain *</span>
		           <span className="text-[10px] text-muted-foreground/50">Routing Hostname</span>
		        </Label>
		        <Select value={formData.domain} onValueChange={(value) => handleSelectChange('domain', value)}>
		          <SelectTrigger id="domain" className="font-mono text-sm bg-black/20 border-border">
		            <SelectValue placeholder="Select a domain" />
		          </SelectTrigger>
		          <SelectContent>
		            {domains.filter(d => d.type === 'custom' || d.is_custom).length > 0 && (
		              <optgroup label="Your Custom Domains" className="text-xs font-semibold text-[#3b82f6] px-2 py-1.5 uppercase tracking-wider">
		                {domains.filter(d => d.type === 'custom' || d.is_custom).map(d => (
		                  <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
		                ))}
		              </optgroup>
		            )}
		            <optgroup label="Global Routing Core" className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider mt-2">
		               {domains.filter(d => d.type !== 'custom' && !d.is_custom).map(d => (
		                 <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
		               ))}
		            </optgroup>
		          </SelectContent>
		        </Select>
		      </div>

		      {/* Preview URL */}
		      <div>
		        <Label htmlFor="previewUrl" className="text-foreground flex items-center justify-between">
		           <span>Preview URL</span>
		           <span className="text-[10px] text-muted-foreground/50">Optional Fallback</span>
		        </Label>
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

		      {/* Burner Link & Expiration */}
		      <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 p-4 rounded-lg space-y-4">
		        <div className="flex items-center gap-2 mb-1">
		           <Flame className="w-5 h-5 text-[#ef4444]" />
		           <h3 className="text-sm font-semibold text-[#ef4444]">Burner Link Options (Auto-Destruct)</h3>
		        </div>
		        <p className="text-[11px] text-muted-foreground ml-7 -mt-4 mb-2">Destructive. Link database records and analytics auto-wipe after threshold.</p>
		        
		        <div className="grid grid-cols-2 gap-4">
		           <div>
		             <Label htmlFor="expirationPeriod" className="text-foreground text-xs">Self-Destruct Timer</Label>
		             <Select value={formData.expirationPeriod} onValueChange={(value) => handleSelectChange('expirationPeriod', value)}>
		               <SelectTrigger id="expirationPeriod" className="mt-1 h-9 text-xs">
		                 <SelectValue placeholder="Select expiration" />
		               </SelectTrigger>
		               <SelectContent>
		                 <SelectItem value="never">Permanent (Never Expires)</SelectItem>
		                 <SelectItem value="1hr">1 Hour</SelectItem>
		                 <SelectItem value="5hrs">5 Hours</SelectItem>
		                 <SelectItem value="24hrs">24 Hours</SelectItem>
		                 <SelectItem value="weekly">1 Week</SelectItem>
		                 <SelectItem value="monthly">1 Month</SelectItem>
		               </SelectContent>
		             </Select>
		           </div>
		           <div>
		             <Label htmlFor="expireAfterClicks" className="text-foreground text-xs flex items-center justify-between">
		                <span>Click Threshold</span>
		                <span className="text-[9px] opacity-50">Limits visits</span>
		             </Label>
		             <Input
		               id="expireAfterClicks"
		               type="number"
		               placeholder="e.g. 100"
		               className="mt-1 h-9 text-xs"
		               value={formData.expireAfterClicks}
		               onChange={handleChange}
		               min="1"
		             />
		           </div>
		        </div>
		      </div>

        {/* Channel Adaptive Mode™ */}
        <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-sm font-semibold text-[#3b82f6]">Channel Adaptive Mode™</h3>
            <span className="ml-auto text-[10px] uppercase font-bold tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded">Pro+</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
            Adjusts scanner deflection, param stripping, delay range, and stealth headers to match your distribution channel.
          </p>
          <Select value={formData.channelType} onValueChange={(value) => handleSelectChange('channelType', value)}>
            <SelectTrigger className="h-9 text-sm bg-black/20 border-border">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <span className="font-medium">General</span>
                <span className="text-muted-foreground text-xs ml-2">— Full tracking, balanced stealth</span>
              </SelectItem>
              <SelectItem value="email">
                <span className="font-medium">Email</span>
                <span className="text-muted-foreground text-xs ml-2">— Max scanner deflection, strip UTM</span>
              </SelectItem>
              <SelectItem value="linkedin">
                <span className="font-medium">LinkedIn</span>
                <span className="text-muted-foreground text-xs ml-2">— Ultra-clean URL, trust-optimised</span>
              </SelectItem>
              <SelectItem value="sms">
                <span className="font-medium">SMS</span>
                <span className="text-muted-foreground text-xs ml-2">— Lightning fast, mobile-first</span>
              </SelectItem>
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
		        <div className="space-y-6 pt-2 border-t border-border mt-4">
		          
		          {/* Zero-Knowledge Mode */}
		          <div className="bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 p-4 rounded-lg">
		             <div className="flex items-center justify-between pointer-events-none mb-1">
		                <div className="flex items-center">
		                   <Shield className="w-4 h-4 mr-2 text-[#8b5cf6]" />
		                   <h3 className="text-sm font-semibold text-[#8b5cf6]">Zero-Knowledge Telemetry</h3>
		                </div>
		                <Checkbox
		                  id="zeroKnowledgeEnabled"
		                  className="pointer-events-auto"
		                  checked={formData.zeroKnowledgeEnabled}
		                  onCheckedChange={(checked) => handleCheckboxChange('zeroKnowledgeEnabled', checked)}
		                />
		             </div>
		             <p className="text-[11px] text-muted-foreground ml-6 leading-relaxed">
		               Encrypts viewer IP logs via one-way salted hashing immediately. Absolutely NO PII (Personally Identifiable Information) or plain-text IPs will be viewable in your dashboard or stored in databases. Ideal for GDPR compliance.
		             </p>
		          </div>

		          {/* Security Features */}
		          <div>
		            <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2 mb-3">Threat Mitigation Stack</h3>
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

		          {/* Subscriber ID Merge Tag */}
		          <div className="bg-[#10b981]/5 border border-[#10b981]/20 p-4 rounded-lg">
		            <div className="flex items-center justify-between mb-2">
		              <div className="flex items-center gap-2">
		                <Info className="w-4 h-4 text-[#10b981]" />
		                <h3 className="text-sm font-semibold text-[#10b981]">Subscriber ID Merge Tag</h3>
		                <span className="text-[10px] uppercase font-bold tracking-widest text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded">Email</span>
		              </div>
		              <Checkbox
		                id="subscriberIdEnabled"
		                checked={formData.subscriberIdEnabled}
		                onCheckedChange={(checked) => handleCheckboxChange('subscriberIdEnabled', checked)}
		              />
		            </div>
		            <p className="text-[11px] text-muted-foreground leading-relaxed">
		              Appends <code className="bg-black/30 px-1 rounded text-[#10b981] font-mono">?id={'{id}'}</code> to your tracking URL as a merge tag.
		              Email senders (SendGrid, Mailchimp, etc.) automatically replace <code className="bg-black/30 px-1 rounded font-mono text-[#10b981]">{'{id}'}</code> with
		              a unique subscriber ID per recipient — each click is individually identified without duplicating links.
		              The redirect chain works whether or not the tag has been replaced.
		            </p>
		            {formData.subscriberIdEnabled && (
		              <div className="mt-3 p-2.5 bg-black/20 rounded border border-[#10b981]/20 space-y-1">
		                <p className="text-[10px] text-muted-foreground">
		                  Merge tag in URL: <span className="text-[#10b981] font-mono">?id={'{id}'}</span>
		                </p>
		                <p className="text-[10px] text-muted-foreground">
		                  After sender substitution: <span className="text-foreground font-mono">?id=SUB_84721</span>
		                </p>
		              </div>
		            )}
		          </div>

		          {/* Capture Options */}
		          <div className="pt-2">
		            <h3 className="text-lg font-semibold text-foreground">Capture Options</h3>
		            <div className="space-y-2 mt-2">
		              {[
		                { id: 'captureEmail', label: 'Capture Email' },
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
	          {loading ? 'Saving...' : editingLink ? 'Update Configuration' : `Create ${type === 'tracking' ? 'Tracking' : 'Short'} Link`}
	        </Button>
	      </DialogFooter>
    </form>
  );
};

export default CreateLinkForm;
