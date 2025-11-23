#!/usr/bin/env python3
"""
Comprehensive Batch Fix Script for Brain Link Tracker
Addresses all critical issues identified in the audit
"""

import os
import sys
import re
import json
import shutil
from pathlib import Path

class ComprehensiveFixer:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.fixes_applied = []
        self.errors = []
        
    def log(self, message, level="INFO"):
        """Log messages with level"""
        prefix = f"[{level}]"
        print(f"{prefix} {message}")
        
    def fix_favicon(self):
        """Fix 1: Update favicon to use correct logo"""
        try:
            self.log("Fixing favicon...")
            
            # Update index.html to use favicon.png
            index_html_path = self.project_root / "index.html"
            with open(index_html_path, 'r') as f:
                content = f.read()
            
            # Replace favicon references
            content = re.sub(
                r'<link rel="icon"[^>]*/>',
                '<link rel="icon" type="image/png" href="/favicon.png" />',
                content
            )
            
            with open(index_html_path, 'w') as f:
                f.write(content)
            
            self.fixes_applied.append("✓ Favicon updated to use correct logo")
            self.log("Favicon fixed successfully", "SUCCESS")
            
        except Exception as e:
            self.errors.append(f"Favicon fix failed: {str(e)}")
            self.log(f"Favicon fix failed: {str(e)}", "ERROR")
    
    def fix_profile_mock_data(self):
        """Fix 2: Remove mock data from Profile component"""
        try:
            self.log("Fixing Profile component to use real API...")
            
            profile_path = self.project_root / "src/components/Profile.jsx"
            
            new_profile_content = '''import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, Mail, Phone, Shield, CreditCard, Calendar,
  CheckCircle, Loader, Upload, Edit, Key, Lock, AlertTriangle, Link, BarChart3
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { toast } from 'sonner';
import api from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userData = await api.profile.get();
      setUser(userData);
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setAvatarPreview(userData.avatar_url);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      await api.profile.uploadAvatar(formData);
      toast.success('Avatar updated successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await api.profile.update({
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone
      });
      toast.success('Profile updated successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (profileData.new_password !== profileData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (!profileData.current_password || !profileData.new_password) {
      toast.error('All password fields are required');
      return;
    }

    try {
      setSaving(true);
      await api.profile.changePassword({
        current_password: profileData.current_password,
        new_password: profileData.new_password
      });
      toast.success('Password changed successfully');
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-foreground">Loading Profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-6 min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and account settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={avatarPreview} alt={user?.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold text-foreground mb-1">
                {user?.username || 'User'}
              </h2>
              <p className="text-muted-foreground mb-2">{user?.email}</p>
              
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary">{user?.plan_type || 'Free'}</Badge>
                <Badge className={`capitalize ${
                  user?.role === 'main_admin' ? 'bg-red-500/20 text-red-400' :
                  user?.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {user?.role || 'member'}
                </Badge>
              </div>

              <div className="w-full space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="file:text-primary"
                />
                <Button
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || saving}
                  className="w-full"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Avatar
                </Button>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center"><Calendar className="h-4 w-4 mr-2" /> Member Since</span>
                  <span className="text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center"><Link className="h-4 w-4 mr-2" /> Total Links</span>
                  <span className="text-foreground">{user?.total_links || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center"><BarChart3 className="h-4 w-4 mr-2" /> Total Clicks</span>
                  <span className="text-foreground">{user?.total_clicks || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">
                  <User className="h-4 w-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" /> Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Email</span>
                    </div>
                    <p className="text-foreground font-medium">{user?.email || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Username</span>
                    </div>
                    <p className="text-foreground font-medium">{user?.username || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Phone</span>
                    </div>
                    <p className="text-foreground font-medium">{user?.phone || 'Not set'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Role</span>
                    </div>
                    <p className="text-foreground font-medium capitalize">{user?.role || 'member'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Plan</span>
                    </div>
                    <p className="text-foreground font-medium capitalize">{user?.plan_type || 'free'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground text-sm">Joined</span>
                    </div>
                    <p className="text-foreground font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-6 space-y-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </TabsContent>

              <TabsContent value="security" className="mt-6 space-y-4">
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                  <CardContent className="p-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-400">
                      For security, you must enter your current password to change it.
                    </p>
                  </CardContent>
                </Card>
                
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={profileData.current_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={profileData.new_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={profileData.confirm_password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
'''
            
            with open(profile_path, 'w') as f:
                f.write(new_profile_content)
            
            self.fixes_applied.append("✓ Profile component updated to use real API (removed mock data)")
            self.log("Profile component fixed successfully", "SUCCESS")
            
        except Exception as e:
            self.errors.append(f"Profile fix failed: {str(e)}")
            self.log(f"Profile fix failed: {str(e)}", "ERROR")
    
    def generate_report(self):
        """Generate comprehensive fix report"""
        report = f"""
{'='*80}
COMPREHENSIVE BATCH FIX REPORT
{'='*80}

Project: Brain Link Tracker
Date: {os.popen('date').read().strip()}
Location: {self.project_root}

{'='*80}
FIXES APPLIED ({len(self.fixes_applied)})
{'='*80}

"""
        for fix in self.fixes_applied:
            report += f"{fix}\n"
        
        if self.errors:
            report += f"\n{'='*80}\nERRORS ENCOUNTERED ({len(self.errors)})\n{'='*80}\n\n"
            for error in self.errors:
                report += f"✗ {error}\n"
        
        report += f"\n{'='*80}\nNEXT STEPS\n{'='*80}\n\n"
        report += "1. Run backend API checks\n"
        report += "2. Build frontend and backend\n"
        report += "3. Push all changes to GitHub\n"
        report += "4. Verify deployment\n"
        
        return report
    
    def run_all_fixes(self):
        """Execute all fixes"""
        self.log("Starting comprehensive batch fix process...")
        self.log(f"Project root: {self.project_root}")
        
        # Execute fixes
        self.fix_favicon()
        self.fix_profile_mock_data()
        
        # Generate and save report
        report = self.generate_report()
        report_path = self.project_root / "BATCH_FIX_REPORT.md"
        with open(report_path, 'w') as f:
            f.write(report)
        
        print("\n" + report)
        self.log(f"Report saved to: {report_path}", "SUCCESS")
        
        return len(self.errors) == 0

if __name__ == "__main__":
    project_root = os.getcwd()
    fixer = ComprehensiveFixer(project_root)
    success = fixer.run_all_fixes()
    sys.exit(0 if success else 1)