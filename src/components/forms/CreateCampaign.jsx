import React, { useState } from 'react';
import api from '../../services/api';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { DialogFooter } from '../ui/dialog';

const CreateCampaignForm = ({ onClose, onCampaignCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    description: '', // Added a description field
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.campaignName.trim()) {
      toast.error('Campaign Name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.campaignName,
        description: formData.description || undefined,
      };

      // Assuming the API service has a campaigns.create method
      const response = await api.campaigns.create(payload); 
      
      if (response.success) {
        toast.success(`Campaign "${formData.campaignName}" created successfully!`);
        // Reset form and close modal
        setFormData({
          campaignName: '',
          description: '',
        });
        onCampaignCreated();
        onClose();
      } else {
        toast.error(response.error || 'Failed to create campaign.');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('An unexpected error occurred while creating the campaign.');
    } finally {
      setLoading(false);
    }
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
	          value={formData.campaignName}
	          onChange={handleChange}
	          required
	        />
	      </div>
	      
	      {/* Campaign Description (Optional) */}
	      <div>
	        <Label htmlFor="description" className="text-foreground">Description (Optional)</Label>
	        <Input
	          id="description"
	          type="text"
	          placeholder="Briefly describe the campaign's goal"
	          value={formData.description}
	          onChange={handleChange}
	        />
	      </div>

	      <DialogFooter className="pt-4">
	        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
	        <Button type="submit" disabled={loading}>
	          {loading ? 'Creating...' : 'Create Campaign'}
	        </Button>
	      </DialogFooter>
    </form>
  );
};

export default CreateCampaignForm;
