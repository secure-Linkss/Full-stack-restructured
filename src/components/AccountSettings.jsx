import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

const glassCard = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const AccountSettings = () => {
  const [user, setUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.profile.get();
      setUser({ name: response.username || '', email: response.email || '' });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setUser(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.profile.update({
        username: user.name,
        email: user.email,
      });
      toast.success('Account details updated successfully!');
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error(error.message || 'Failed to update account details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        style={glassCard}
        className="p-6"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={cardVariants}
      >
        <div className="h-32 flex items-center justify-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">Loading account details...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={glassCard}
      className="p-6"
      initial="hidden"
      animate="visible"
      custom={0}
      variants={cardVariants}
    >
      {/* Section Header */}
      <div
        className="flex items-center gap-2 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
        >
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Account Information</h3>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Update your personal details and email address.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Username Field */}
        <motion.div className="space-y-1.5" variants={cardVariants} custom={1} initial="hidden" animate="visible">
          <label
            htmlFor="name"
            className="text-[10px] font-semibold uppercase tracking-widest block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Username
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            />
            <input
              id="name"
              className="enterprise-input w-full pl-9"
              value={user.name}
              onChange={handleInputChange}
              placeholder="Your username"
              required
            />
          </div>
        </motion.div>

        {/* Email Field */}
        <motion.div className="space-y-1.5" variants={cardVariants} custom={2} initial="hidden" animate="visible">
          <label
            htmlFor="email"
            className="text-[10px] font-semibold uppercase tracking-widest block"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            />
            <input
              id="email"
              type="email"
              className="enterprise-input w-full pl-9"
              value={user.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              required
            />
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={cardVariants} custom={3} initial="hidden" animate="visible">
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                </div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AccountSettings;
