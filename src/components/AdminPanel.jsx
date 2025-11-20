import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { 
  Shield, Users, Link, FolderKanban, Settings, CreditCard, 
  FileText, Megaphone, LayoutDashboard 
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import { Button } from './ui/button';

// Import Admin Sub-components
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminLinks from './admin/AdminLinks';
import AdminCampaigns from './admin/AdminCampaigns';
import AdminSettings from './admin/AdminSettings';
import AdminPayments from './admin/AdminPayments';
import AdminSystemLogs from './admin/AdminSystemLogs';
import AdminAnnouncements from './admin/AdminAnnouncements';
import AdminSecurity from './admin/AdminSecurity'; // Adding the Security tab

// --- Main Admin Panel Component ---

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const adminTabs = [
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, component: AdminDashboard },
    { id: 'users', title: 'Users', icon: Users, component: AdminUsers },
    { id: 'links', title: 'Links', icon: Link, component: AdminLinks },
    { id: 'campaigns', title: 'Campaigns', icon: FolderKanban, component: AdminCampaigns },
    { id: 'security', title: 'Security', icon: Shield, component: AdminSecurity }, // Added Security
    { id: 'payments', title: 'Payments', icon: CreditCard, component: AdminPayments },
    { id: 'logs', title: 'System Logs', icon: FileText, component: AdminSystemLogs },
    { id: 'announcements', title: 'Announcements', icon: Megaphone, component: AdminAnnouncements },
    { id: 'settings', title: 'Settings', icon: Settings, component: AdminSettings }, // Moved Settings to the end
  ];

  const ActiveComponent = adminTabs.find(tab => tab.id === activeTab)?.component || AdminDashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Centralized control and management for the entire platform"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {adminTabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.title}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
