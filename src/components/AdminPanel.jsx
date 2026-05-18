import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Link, FolderKanban, Settings, CreditCard,
  FileText, Megaphone, LayoutDashboard, Globe, Activity,
  Crown, ShieldCheck, Mail, MessageSquare, ChevronRight
} from 'lucide-react';

import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminLinks from './admin/AdminLinks';
import AdminCampaigns from './admin/AdminCampaigns';
import AdminSettings from './admin/AdminSettings';
import AdminSystemMonitoring from './admin/AdminSystemMonitoring';
import AdminPayments from './admin/AdminPayments';
import AdminSystemLogs from './admin/AdminSystemLogs';
import AdminAnnouncements from './admin/AdminAnnouncements';
import AdminSecurity from './admin/AdminSecurity';
import AdminDomains from './admin/AdminDomains';
import AdminTickets from './admin/AdminTickets';
import AdminContacts from './admin/AdminContacts';

const adminTabs = [
  { id: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard, component: AdminDashboard,        ownerOnly: false, group: 'Overview' },
  { id: 'monitoring',   label: 'System Metrics',   icon: Activity,        component: AdminSystemMonitoring,  ownerOnly: false, group: 'Overview' },
  { id: 'users',        label: 'Users',            icon: Users,           component: AdminUsers,             ownerOnly: false, group: 'Management' },
  { id: 'links',        label: 'Links',            icon: Link,            component: AdminLinks,             ownerOnly: false, group: 'Management' },
  { id: 'campaigns',    label: 'Campaigns',        icon: FolderKanban,    component: AdminCampaigns,         ownerOnly: false, group: 'Management' },
  { id: 'tickets',      label: 'Support Hub',      icon: MessageSquare,   component: AdminTickets,           ownerOnly: false, group: 'Management' },
  { id: 'contacts',     label: 'Contact Inbox',    icon: Mail,            component: AdminContacts,          ownerOnly: false, group: 'Management' },
  { id: 'payments',     label: 'Revenue & Crypto', icon: CreditCard,      component: AdminPayments,          ownerOnly: false, group: 'Finance' },
  { id: 'domains',      label: 'Domains',          icon: Globe,           component: AdminDomains,           ownerOnly: false, group: 'System' },
  { id: 'security',     label: 'Security',         icon: Shield,          component: AdminSecurity,          ownerOnly: false, group: 'System' },
  { id: 'logs',         label: 'System Logs',      icon: FileText,        component: AdminSystemLogs,        ownerOnly: false, group: 'System' },
  { id: 'announcements',label: 'Announcements',    icon: Megaphone,       component: AdminAnnouncements,     ownerOnly: false, group: 'System' },
  { id: 'settings',     label: 'Settings',         icon: Settings,        component: AdminSettings,          ownerOnly: true,  group: 'System' },
];

const sidebarItemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.03, duration: 0.22, ease: [0.4, 0, 0.2, 1] } }),
};

const contentVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const isOwner = user?.role === 'main_admin';
  const roleName = isOwner ? 'Owner' : 'Admin';
  const RoleIcon = isOwner ? Crown : ShieldCheck;
  const roleAccent = isOwner ? '#f59e0b' : '#3b82f6';
  const roleGlow = isOwner ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)';

  const visibleTabs = adminTabs.filter(t => !t.ownerOnly || isOwner);
  const activeTabObj = visibleTabs.find(t => t.id === activeTab) || visibleTabs[0];
  const ActiveComponent = activeTabObj?.component || AdminDashboard;

  const groups = [...new Set(visibleTabs.map(t => t.group))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.03em' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            Platform{' '}
            <span style={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Administration
            </span>
          </h2>
          <p className="text-white/35 text-sm mt-1 ml-11">Centralized control and global SaaS management</p>
        </div>

        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase self-start sm:self-auto"
          style={{
            background: `rgba(${isOwner ? '245,158,11' : '59,130,246'},0.08)`,
            border: `1px solid ${isOwner ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)'}`,
            boxShadow: `0 0 20px ${roleGlow}`,
          }}
        >
          <RoleIcon className="w-3.5 h-3.5" style={{ color: roleAccent }} />
          <span style={{ color: roleAccent }}>{roleName}</span>
          {user?.username && <span className="text-white/30 font-normal normal-case">· {user.username}</span>}
        </motion.div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden overflow-x-auto pb-1 -mx-1">
        <div className="flex gap-1 min-w-max px-1">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={isActive
                  ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }
                }
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar — desktop */}
        <div className="hidden lg:block lg:w-60 flex-shrink-0">
          <div className="rounded-xl p-3 sticky top-24" style={{ background: 'rgba(8,15,35,0.72)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
            <nav className="space-y-4">
              {groups.map(group => {
                const groupTabs = visibleTabs.filter(t => t.group === group);
                return (
                  <div key={group}>
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] px-3 mb-1">{group}</p>
                    <div className="space-y-0.5">
                      {groupTabs.map((tab, i) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <motion.button
                            key={tab.id}
                            custom={i}
                            variants={sidebarItemVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ x: isActive ? 0 : 2 }}
                            onClick={() => setActiveTab(tab.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left group relative"
                            style={isActive
                              ? {
                                  background: 'linear-gradient(90deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))',
                                  color: '#34d399',
                                  boxShadow: 'inset 3px 0 0 #10b981',
                                }
                              : { color: 'rgba(255,255,255,0.4)' }
                            }
                          >
                            <tab.icon className="w-4 h-4 shrink-0 transition-colors" style={isActive ? { color: '#10b981' } : {}} />
                            <span className="flex-1 font-medium truncate">{tab.label}</span>
                            {tab.ownerOnly && <Crown className="w-3 h-3 text-amber-500/50 shrink-0" title="Owner only" />}
                            {isActive && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: '#10b981', opacity: 0.6 }} />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Role info box */}
            <div className="mt-4 mx-1 p-3 rounded-lg" style={{ background: `rgba(${isOwner ? '245,158,11' : '59,130,246'},0.06)`, border: `1px solid ${isOwner ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}` }}>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: roleAccent }}>
                <RoleIcon className="w-3 h-3" /> {roleName} Access
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                {isOwner
                  ? 'Full platform control. Wallet management, system settings, admin promotion.'
                  : 'Manage users, links, campaigns, and view revenue. Settings are owner-only.'}
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            >
              <ActiveComponent isOwner={isOwner} userRole={user?.role} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
