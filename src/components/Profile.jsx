import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Shield, CreditCard, Calendar,
  CheckCircle, Loader, Upload, Edit, Lock, AlertTriangle, Link, BarChart3, Camera
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../services/api';

const glass = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)',
};

const infoCard = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  padding: '14px 16px',
};

const ROLE_STYLE = {
  main_admin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Main Admin' },
  admin:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)', label: 'Admin' },
  user:       { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)', label: 'User' },
};

const PLAN_STYLE = {
  enterprise: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  pro:        { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  free:       { color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)' },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }),
};

const INFO_FIELDS = [
  { key: 'email',      label: 'Email Address',  icon: Mail,       accessor: u => u?.email || 'Not set' },
  { key: 'username',   label: 'Username',       icon: User,       accessor: u => u?.username || 'Not set' },
  { key: 'phone',      label: 'Phone',          icon: Phone,      accessor: u => u?.phone || 'Not set' },
  { key: 'role',       label: 'Role',           icon: Shield,     accessor: u => u?.role ? (ROLE_STYLE[u.role]?.label || u.role) : 'Member' },
  { key: 'plan',       label: 'Plan',           icon: CreditCard, accessor: u => u?.plan_type || 'Free' },
  { key: 'joined',     label: 'Member Since',   icon: Calendar,   accessor: u => u?.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
];

const Profile = () => {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [activeTab, setActiveTab]     = useState('overview');
  const [avatarFile, setAvatarFile]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [profileData, setProfileData] = useState({
    username: '', email: '', phone: '',
    current_password: '', new_password: '', confirm_password: '',
  });

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userData = await api.profile.get();
      setUser(userData);
      setProfileData({ username: userData.username || '', email: userData.email || '', phone: userData.phone || '', current_password: '', new_password: '', confirm_password: '' });
      setAvatarPreview(userData.avatar_url);
    } catch {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUserData(); }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setSaving(true);
    try {
      const fd = new FormData(); fd.append('avatar', avatarFile);
      await api.profile.uploadAvatar(fd);
      toast.success('Avatar updated');
      fetchUserData();
    } catch { toast.error('Failed to upload avatar'); }
    finally { setSaving(false); }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await api.profile.update({ username: profileData.username, email: profileData.email, phone: profileData.phone });
      toast.success('Profile updated');
      fetchUserData();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (profileData.new_password !== profileData.confirm_password) return toast.error('Passwords do not match');
    if (!profileData.current_password || !profileData.new_password) return toast.error('All fields required');
    setSaving(true);
    try {
      await api.profile.changePassword({ current_password: profileData.current_password, new_password: profileData.new_password });
      toast.success('Password changed');
      setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
    } catch { toast.error('Failed to change password'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
      </div>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center py-32 text-white/40">
      Failed to load profile.
    </div>
  );

  const roleCfg = ROLE_STYLE[user.role] || ROLE_STYLE.user;
  const planCfg = PLAN_STYLE[user.plan_type?.toLowerCase()] || PLAN_STYLE.free;
  const initials = (user.username || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white/90 mb-1" style={{ letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>
          My Profile
        </h1>
        <p className="text-sm text-white/35">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Avatar card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ ...glass, padding: '28px 24px' }}
          className="lg:col-span-1 flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative mb-5">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
              style={{
                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                boxShadow: '0 0 0 3px rgba(59,130,246,0.25), 0 0 0 6px rgba(59,130,246,0.08)',
              }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            {/* Camera trigger */}
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: 'rgba(59,130,246,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              title="Change avatar"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <h2 className="text-xl font-bold text-white/90 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            {user.username || 'User'}
          </h2>
          <p className="text-sm text-white/40 mb-4">{user.email}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full capitalize" style={{ background: planCfg.bg, color: planCfg.color, border: `1px solid ${planCfg.border}` }}>
              {user.plan_type || 'Free'}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}` }}>
              {roleCfg.label}
            </span>
          </div>

          {/* Upload button (only shown when a file is staged) */}
          {avatarFile && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleAvatarUpload}
              disabled={saving}
              className="w-full btn-primary mb-5 flex items-center justify-center gap-2"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Avatar
            </motion.button>
          )}

          {/* Stats row */}
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            {[
              { label: 'Total Links',  value: user.total_links  || 0, icon: Link,     color: '#3b82f6' },
              { label: 'Total Clicks', value: user.total_clicks || 0, icon: BarChart3, color: '#10b981' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{stat.label}</span>
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Member since */}
          <div className="w-full mt-3 pt-3 flex items-center justify-center gap-2 text-white/30 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Calendar className="w-3.5 h-3.5" />
            Member since {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
        </motion.div>

        {/* ── Right: Detail panel ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
          style={{ ...glass, padding: 0 }}
          className="lg:col-span-2 overflow-hidden"
        >
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-base font-semibold text-white/90">Account Details</h3>
            <p className="text-xs text-white/35 mt-0.5">View and update your account information.</p>
          </div>

          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview"><User className="w-3.5 h-3.5 mr-1.5" />Overview</TabsTrigger>
                <TabsTrigger value="edit"><Edit className="w-3.5 h-3.5 mr-1.5" />Edit Profile</TabsTrigger>
                <TabsTrigger value="security"><Lock className="w-3.5 h-3.5 mr-1.5" />Security</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INFO_FIELDS.map((field, i) => {
                    const Icon = field.icon;
                    return (
                      <motion.div key={field.key} custom={i} variants={cardVariants} initial="hidden" animate="visible" style={infoCard}>
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 6, padding: 5 }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">{field.label}</span>
                        </div>
                        <p className="text-sm font-medium text-white/80 pl-0.5">{field.accessor(user)}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Edit tab */}
              <TabsContent value="edit">
                <div className="space-y-4 max-w-md">
                  {[
                    { label: 'Username', field: 'username', type: 'text' },
                    { label: 'Email Address', field: 'email', type: 'email' },
                    { label: 'Phone Number', field: 'phone', type: 'tel' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5 block">{label}</Label>
                      <Input
                        type={type}
                        value={profileData[field]}
                        onChange={e => setProfileData(prev => ({ ...prev, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <button onClick={handleUpdateProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                      {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* Security tab */}
              <TabsContent value="security">
                <div className="space-y-4 max-w-md">
                  {/* Warning */}
                  <div className="flex items-start gap-3 p-3.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/90 leading-relaxed">
                      You must enter your current password to change it. Use a strong password of 8+ characters.
                    </p>
                  </div>
                  {[
                    { label: 'Current Password', field: 'current_password' },
                    { label: 'New Password',      field: 'new_password' },
                    { label: 'Confirm Password',  field: 'confirm_password' },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5 block">{label}</Label>
                      <Input
                        type="password"
                        value={profileData[field]}
                        onChange={e => setProfileData(prev => ({ ...prev, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <button onClick={handleChangePassword} disabled={saving} className="btn-primary flex items-center gap-2">
                      {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Change Password
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
