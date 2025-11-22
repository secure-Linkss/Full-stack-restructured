import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Globe, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import api from '../../services/api';

const DomainManagementTab = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  
  const [formData, setFormData] = useState({
    domain: '',
    domain_type: 'custom',
    description: '',
    is_active: true,
    api_key: '',
    api_secret: ''
  });

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await api.adminSettings.getDomains();
      setDomains(response || []);
      toast.success('Domains loaded successfully.');
    } catch (error) {
      console.error('Fetch domains error:', error);
      toast.error('Failed to load domains.');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAdd = async () => {
    try {
      await api.adminSettings.addDomain(formData);
      toast.success('Domain added successfully!');
      setIsAddModalOpen(false);
      resetForm();
      fetchDomains();
    } catch (error) {
      toast.error(`Failed to add domain: ${error.message}`);
    }
  };

  const handleEdit = async () => {
    try {
      await api.adminSettings.updateDomain(selectedDomain.id, formData);
      toast.success('Domain updated successfully!');
      setIsEditModalOpen(false);
      resetForm();
      fetchDomains();
    } catch (error) {
      toast.error(`Failed to update domain: ${error.message}`);
    }
  };

  const handleDelete = async (domain) => {
    if (window.confirm(`Are you sure you want to delete domain ${domain.domain}?`)) {
      try {
        await api.adminSettings.deleteDomain(domain.id);
        toast.success('Domain deleted successfully!');
        fetchDomains();
      } catch (error) {
        toast.error(`Failed to delete domain: ${error.message}`);
      }
    }
  };

  const openEditModal = (domain) => {
    setSelectedDomain(domain);
    setFormData({
      domain: domain.domain,
      domain_type: domain.domain_type,
      description: domain.description || '',
      is_active: domain.is_active,
      api_key: domain.api_key || '',
      api_secret: domain.api_secret || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      domain_type: 'custom',
      description: '',
      is_active: true,
      api_key: '',
      api_secret: ''
    });
    setSelectedDomain(null);
  };

  const columns = [
    {
      header: 'Domain',
      accessor: 'domain',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.domain}
          <p className="text-sm text-muted-foreground">{row.description || 'No description'}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'domain_type',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium px-2 py-0.5 rounded-full capitalize bg-blue-500/20 text-blue-400">
          {row.domain_type}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      cell: (row) => (
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
          row.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Verified',
      accessor: 'is_verified',
      sortable: true,
      cell: (row) => (
        row.is_verified ? 
          <CheckCircle className="h-5 w-5 text-green-400" /> : 
          <XCircle className="h-5 w-5 text-yellow-400" />
      ),
    },
    {
      header: 'Links',
      accessor: 'total_links',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.total_links?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'total_clicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.total_clicks?.toLocaleString() || 0}</span>,
    },
  ];

  const DomainForm = ({ onSubmit, submitLabel }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="domain">Domain Name *</Label>
        <Input
          id="domain"
          placeholder="example.com"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="domain_type">Domain Type *</Label>
        <Select
          value={formData.domain_type}
          onValueChange={(value) => setFormData({ ...formData, domain_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Domain</SelectItem>
            <SelectItem value="shortio">Short.io Integration</SelectItem>
            <SelectItem value="vercel">Vercel Domain</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Optional description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      {formData.domain_type === 'shortio' && (
        <>
          <div>
            <Label htmlFor="api_key">Short.io API Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="Your Short.io API key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="api_secret">Short.io API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              placeholder="Your Short.io API secret"
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
            />
          </div>
        </>
      )}
      
      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
      
      <Button onClick={onSubmit} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" /> 
                Domain Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage custom domains for link shortening
              </p>
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Domain</DialogTitle>
                </DialogHeader>
                <DomainForm onSubmit={handleAdd} submitLabel="Add Domain" />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Domains...</div>
          ) : (
            <DataTable
              columns={columns}
              data={domains}
              pageSize={10}
              actions={(row) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(row)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
          </DialogHeader>
          <DomainForm onSubmit={handleEdit} submitLabel="Update Domain" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DomainManagementTab;
