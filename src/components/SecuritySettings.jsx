import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';

const SecuritySettings = () => {
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPasswords(prev => ({ ...prev, [id]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (passwords.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/user/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success('Password updated successfully!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Lock className="h-5 w-5 mr-2 text-primary" /> Security & Password</CardTitle>
        <p className="text-sm text-muted-foreground">Change your password and manage two-factor authentication (2FA).</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Change Form */}
        <form onSubmit={handlePasswordChange} className="space-y-4 border-b pb-6">
          <h4 className="font-semibold">Change Password</h4>
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              value={passwords.current_password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={passwords.new_password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwords.confirm_password}
              onChange={handleInputChange}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Change Password'}
          </Button>
        </form>

        {/* Two-Factor Authentication (2FA) - Placeholder for future implementation */}
        <div className="space-y-4">
          <h4 className="font-semibold">Two-Factor Authentication (2FA)</h4>
          <div className="flex items-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="h-5 w-5 mr-3 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              2FA is currently a placeholder. Full implementation is planned for the next major release to ensure maximum security.
            </p>
          </div>
          <Button variant="outline" disabled>Enable 2FA (Coming Soon)</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
