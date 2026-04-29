import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import api from '../../services/api';

const EditUserModal = ({ isOpen, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'member',
    plan_type: 'free',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'member',
        plan_type: user.plan_type || 'free',
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || formData.username.length < 3) return toast.error('Username too short');
    
    setLoading(true);
    try {
      await api.adminUsers.update(user.id, formData);
      toast.success(`User ${formData.username} profile updated successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto bg-[#141d2e] border border-[#1e2d47] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Profile: {user?.username}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="bg-background border-[#1e2d47]" />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-background border-[#1e2d47]" />
          </div>
          <div>
            <Label>Permission Role</Label>
             <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="bg-background border-[#1e2d47]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label>Subscription Tier</Label>
             <Select value={formData.plan_type} onValueChange={(value) => setFormData({ ...formData, plan_type: value })}>
              <SelectTrigger className="bg-background border-[#1e2d47]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Node</SelectItem>
                <SelectItem value="pro">Pro Engine</SelectItem>
                <SelectItem value="enterprise">Global Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-[#1e2d47]">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Committing...' : 'Commit Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
