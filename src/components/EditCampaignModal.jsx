import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';

const EditCampaignModal = ({ isOpen, onClose, onSuccess, campaign }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
         name: campaign.name || '',
         description: campaign.description || ''
      });
    }
  }, [campaign, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Campaign Name is required');
    
    setLoading(true);
    try {
      await api.campaigns.update(campaign.id, formData);
      toast.success(`Campaign [${formData.name}] node updated successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Failed to update campaign node map.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle>Edit Campaign Vector</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="name">Campaign Identifier Link</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-background" />
          </div>
          <div>
            <Label htmlFor="description">Internal Target Description</Label>
            <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-background" />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? 'Patching Matrix...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignModal;
