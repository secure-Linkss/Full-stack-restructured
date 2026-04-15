import React, { useState } from 'react';
import {
  Shield, Users, Link, FolderKanban, Settings, CreditCard,
  FileText, Megaphone, LayoutDashboard, Globe, Activity, Crown, ShieldCheck, Mail
} from 'lucide-react';

// Import Admin Sub-components
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
import { MessageSquare } from 'lucide-react';

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const isOwner = user?.role === 'main_admin';
  const roleName = isOwner ? 'Owner' : 'Admin';
  const RoleIcon = isOwner ? Crown : ShieldCheck;
  const roleColor = isOwner ? 'text-[#f59e0b]' : 'text-[#3b82f6]';
  const roleBg = isOwner ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' : 'bg-[#3b82f6]/10 border-[#3b82f6]/30';

  const adminTabs = [
    { id: 'dashboard',   title: 'Dashboard',       icon: LayoutDashboard, component: AdminDashboard,       ownerOnly: false },
    { id: 'monitoring',  title: 'System Metrics',   icon: Activity,        component: AdminSystemMonitoring, ownerOnly: false },
    { id: 'domains',     title: 'Domains',          icon: Globe,           component: AdminDomains,          ownerOnly: false },
    { id: 'payments',    title: 'Revenue & Crypto', icon: CreditCard,      component: AdminPayments,         ownerOnly: false },
    { id: 'users',       title: 'Users',            icon: Users,           component: AdminUsers,            ownerOnly: false },
    { id: 'links',       title: 'Links',            icon: Link,            component: AdminLinks,            ownerOnly: false },
    { id: 'campaigns',   title: 'Campaigns',        icon: FolderKanban,    component: AdminCampaigns,        ownerOnly: false },
    { id: 'tickets',     title: 'Support Hub',      icon: MessageSquare,   component: AdminTickets,          ownerOnly: false },
    { id: 'contacts',    title: 'Contact Inbox',    icon: Mail,            component: AdminContacts,         ownerOnly: false },
    { id: 'security',    title: 'Security',         icon: Shield,          component: AdminSecurity,         ownerOnly: false },
    { id: 'logs',        title: 'System Logs',      icon: FileText,        component: AdminSystemLogs,       ownerOnly: false },
    { id: 'announcements', title: 'Announcements',  icon: Megaphone,       component: AdminAnnouncements,    ownerOnly: false },
    { id: 'settings',    title: 'Settings',         icon: Settings,        component: AdminSettings,         ownerOnly: true },
  ];

  // Filter tabs — admins cannot access Settings (owner-only)
  const visibleTabs = adminTabs.filter(tab => !tab.ownerOnly || isOwner);

  const ActiveComponent = visibleTabs.find(tab => tab.id === activeTab)?.component
    || (isOwner ? AdminDashboard : AdminDashboard);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-heading text-foreground flex items-center">
             <Shield className="w-6 h-6 mr-3 text-[#10b981]" />
             Platform Administration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Centralized control and global SaaS management</p>
        </div>
        {/* Role Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase ${roleBg}`}>
          <RoleIcon className={`w-3.5 h-3.5 ${roleColor}`} />
          <span className={roleColor}>{roleName}</span>
          {user?.username && <span className="text-muted-foreground font-normal normal-case">· {user.username}</span>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="enterprise-card p-3 sticky top-24">
            <h3 className="nav-group-header px-3 mb-2 mt-1">Admin Modules</h3>
            <nav className="space-y-1">
              {visibleTabs.map(tab => {
                 const isActive = activeTab === tab.id;
                 return (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center p-2.5 transition-all duration-200 text-sm group relative rounded-md ${
                         isActive
                         ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] font-semibold border-l-2 border-[#10b981]'
                         : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.025)] hover:text-foreground border-l-2 border-transparent'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon className={`h-[18px] w-[18px] mr-3 shrink-0 ${isActive ? 'text-[#10b981]' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="truncate">{tab.title}</span>
                      {tab.ownerOnly && (
                        <Crown className="w-3 h-3 ml-auto text-[#f59e0b] opacity-60 shrink-0" title="Owner only" />
                      )}
                    </button>
                 );
              })}
            </nav>

            {/* Role info footer */}
            <div className={`mt-4 mx-2 p-2.5 rounded-lg border text-[10px] ${roleBg}`}>
              <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1 ${roleColor}`}>
                <RoleIcon className="w-3 h-3" /> {roleName} Access
              </div>
              {isOwner ? (
                <p className="text-muted-foreground leading-relaxed">Full platform control. Wallet management, system settings, and admin promotion enabled.</p>
              ) : (
                <p className="text-muted-foreground leading-relaxed">Can manage users, links, campaigns, and view revenue. Wallet addresses and system settings are owner-only.</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <ActiveComponent isOwner={isOwner} userRole={user?.role} />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
