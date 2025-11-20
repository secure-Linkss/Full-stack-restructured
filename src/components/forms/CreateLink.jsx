import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

const CreateLinkForm = ({ onClose, onLinkCreated }) => {
  const [formData, setFormData] = useState({
    targetUrl: '',
    previewUrl: '',
    campaignName: '',
    linkExpiration: 'Never Expires',
    botBlocking: true,
    rateLimiting: false,
    dynamicSignature: false,
    mxVerification: false,
    geoTargeting: false,
    captureEmail: false,
    capturePassword: false,
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id, checked) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, linkExpiration: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.targetUrl || !formData.campaignName) {
      toast.error('Target URL and Campaign Name are required.');
      return;
    }

    // Mock API call to create link
    console.log('Submitting new link:', formData);
    toast.success('Link created successfully (Mock)');
    
    // In a real app, you would call the API here and then:
    // onLinkCreated();
    onClose();
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

      {/* Campaign Name */}
      <div>
        <Label htmlFor="campaignName" className="text-foreground">Campaign Name *</Label>
        <Input
          id="campaignName"
          type="text"
          placeholder="My New Campaign"
          value={formData.campaignName}
          onChange={handleChange}
          required
        />
      </div>

      {/* Link Expiration */}
      <div>
        <Label htmlFor="linkExpiration" className="text-foreground">Link Expiration (Optional)</Label>
        <Select value={formData.linkExpiration} onValueChange={handleSelectChange}>
          <SelectTrigger id="linkExpiration">
            <SelectValue placeholder="Select expiration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Never Expires">Never Expires</SelectItem>
            <SelectItem value="1 Hour">1 Hour</SelectItem>
            <SelectItem value="1 Day">1 Day</SelectItem>
            <SelectItem value="1 Week">1 Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Security Features */}
      <div className="pt-2">
        <h3 className="text-lg font-semibold text-foreground">Security Features</h3>
        <div className="space-y-2 mt-2">
          {['botBlocking', 'rateLimiting', 'dynamicSignature', 'mxVerification', 'geoTargeting'].map(feature => (
            <div key={feature} className="flex items-center justify-between">
              <Label htmlFor={feature} className="text-muted-foreground capitalize">
                {feature.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Checkbox
                id={feature}
                checked={formData[feature]}
                onCheckedChange={(checked) => handleCheckboxChange(feature, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Capture Options */}
      <div className="pt-2">
        <h3 className="text-lg font-semibold text-foreground">Capture Options</h3>
        <div className="space-y-2 mt-2">
          {['captureEmail', 'capturePassword'].map(option => (
            <div key={option} className="flex items-center justify-between">
              <Label htmlFor={option} className="text-muted-foreground capitalize">
                {option.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Checkbox
                id={option}
                checked={formData[option]}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create Link</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateLinkForm;
