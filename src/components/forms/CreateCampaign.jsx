import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { DialogFooter } from '../ui/dialog';

const CreateCampaignForm = ({ onClose, onCampaignCreated }) => {
  const [campaignName, setCampaignName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error('Campaign Name is required.');
      return;
    }

    // Mock API call to create campaign
    console.log('Submitting new campaign:', campaignName);
    toast.success(`Campaign "${campaignName}" created successfully (Mock)`);
    
    // In a real app, you would call the API here and then:
    // onCampaignCreated();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campaign Name */}
      <div>
        <Label htmlFor="campaignName" className="text-foreground">Campaign Name *</Label>
        <Input
          id="campaignName"
          type="text"
          placeholder="e.g., Summer Promo 2024"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          required
        />
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create Campaign</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateCampaignForm;
