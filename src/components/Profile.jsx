import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, Mail, Phone, Shield, CreditCard, Calendar,
  CheckCircle, Loader, Upload, Edit, Key, Lock, AlertTriangle
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { toast } from 'sonner';

// Mock Auth Hook for frontend development
const useMockAuth = () => {
  const [user, setUser] = useState({
    id: 1,
    username: 'admin',
    email: 'admin@brainlinktracker.com',
    phone: '555-123-4567',
    role: 'main_admin',
    plan_type: 'premium',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    created_at: '2023-01-15',
    total_links: 45,
    total_clicks: 12000,
  });
  const [loading, setLoading] = useState(false);

  // Mock API calls
  const fetchUserData = () => {
    // Mock fetching user data
    return new Promise(resolve => setTimeout(() => resolve(user), 500));
  };

  const updateProfile = (data) => {
    // Mock updating profile
    return new Promise(resolve => setTimeout(() => {
      setUser(prev => ({ ...prev, ...data }));
      resolve();
    }, 500));
  };

  const changePassword = () => {
    // Mock changing password
    return new Promise(resolve => setTimeout(() => resolve(), 500));
  };

  const uploadAvatar = (file) => {
    // Mock uploading avatar
    return new Promise(resolve => setTimeout(() => {
      // In a real app, this would return the new URL
      setUser(prev => ({ ...prev, avatar_url: 'https://i.pravatar.cc/150?img=2' }));
      resolve();
    }, 500));
  };

  return { user, loading, fetchUserData, updateProfile, changePassword, uploadAvatar };
};


const Profile = () => {
  const { user, loading, fetchUserData, updateProfile, changePassword, uploadAvatar } = useMockAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url);

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setAvatarPreview(user.avatar_url);
    }
  }, [user]);

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
      await uploadAvatar(avatarFile);
      toast.success('Avatar updated successfully');
      // Re-fetch data to ensure consistency
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
      await updateProfile({
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone
      });
      toast.success('Profile updated successfully');
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
      await changePassword();
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
                  <span className="text-foreground">{user?.created_at || 'N/A'}</span>
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
                    <p className="text-foreground font-medium">{user?.created_at || 'N/A'}</p>
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
