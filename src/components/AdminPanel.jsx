import React, { useState } from 'react';
import { 
  Shield, Users, Link, FolderKanban, Settings, CreditCard, 
  FileText, Megaphone, LayoutDashboard, Globe, Activity
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
import { MessageSquare } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const adminTabs = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, component: AdminDashboard },
    { id: 'monitoring', title: 'System Metrics', icon: Activity, component: AdminSystemMonitoring },
    { id: 'domains', title: 'Domains', icon: Globe, component: AdminDomains },
    { id: 'payments', title: 'Revenue & Crypto', icon: CreditCard, component: AdminPayments },
    { id: 'users', title: 'Users', icon: Users, component: AdminUsers },
    { id: 'links', title: 'Links', icon: Link, component: AdminLinks },
    { id: 'campaigns', title: 'Campaigns', icon: FolderKanban, component: AdminCampaigns },
    { id: 'tickets', title: 'Support Hub', icon: MessageSquare, component: AdminTickets },
    { id: 'security', title: 'Security', icon: Shield, component: AdminSecurity },
    { id: 'logs', title: 'System Logs', icon: FileText, component: AdminSystemLogs },
    { id: 'announcements', title: 'Announcements', icon: Megaphone, component: AdminAnnouncements },
    { id: 'settings', title: 'Settings', icon: Settings, component: AdminSettings },
  ];

  const ActiveComponent = adminTabs.find(tab => tab.id === activeTab)?.component || AdminDashboard;

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
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="enterprise-card p-3 sticky top-24">
            <h3 className="nav-group-header px-3 mb-2 mt-1">Admin Modules</h3>
            <nav className="space-y-1">
              {adminTabs.map(tab => {
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
                    </button>
                 );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
