import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Link, Plus, RefreshCw, Filter, Copy, BarChart3, Trash2, Edit } from 'lucide-react';
import EnhancedLinkBox from './EnhancedLinkBox';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import CreateLinkForm from './forms/CreateLink'; // Reusing the form component


// --- Main LinkShortener Component ---

const LinkShortener = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	  const [metrics, setMetrics] = useState({ totalLinks: 0, activeLinks: 0, totalClicks: 0 });
	  const [selectedLink, setSelectedLink] = useState(null); // State for the link to display in the box

	  const fetchData = async () => {
	    setLoading(true);
	    try {
	      // Assuming api.getShortenedLinks and api.getShortenerMetrics are placeholders 
	      // for the new api.shorten.getAll and a dashboard metric endpoint.
	      // Since the new api.js doesn't have getShortenedLinks/getShortenerMetrics, 
	      // I'll assume the backend uses the /shorten endpoint for links and a general dashboard endpoint for metrics.
	      const [linksResponse, metricsResponse] = await Promise.all([
	        api.shorten.getAll(),
	        api.dashboard.getMetrics(), // Reusing dashboard metrics for now
	      ]);
	      
	      // The actual links data is likely in a 'links' property of the response
	      const linksData = linksResponse.links || linksResponse; 
	      setLinks(linksData);
	      if (linksData.length > 0 && !selectedLink) {
	        setSelectedLink(linksData[0]); // Select the first link by default
	      } else if (linksData.length > 0 && selectedLink) {
	        // Update the selected link if it still exists in the list
	        const updatedSelected = linksData.find(l => l.id === selectedLink.id);
	        if (updatedSelected) setSelectedLink(updatedSelected);
	      } else {
	        setSelectedLink(null);
	      }
	      
	      // Filter metrics for shortener-specific ones if possible, otherwise use general
	      setMetrics({
	        totalLinks: linksData.length, // Fallback to count
	        activeLinks: linksData.filter(l => l.status === 'active').length, // Fallback to count
	        totalClicks: metricsResponse.totalClicks || 0,
	      });
	      
	      toast.success('Shortened links refreshed.');
	    } catch (error) {
	      console.error('Error fetching shortened links:', error);
	      toast.error('Failed to load shortened links.');
	    } finally {
	      setLoading(false);
	    }
	  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleCreateNewLink = () => {
    setIsCreateModalOpen(true);
  };

		  const handleAction = async (action, link) => {
		    if (action === 'Regenerate') {
		      if (window.confirm(`Are you sure you want to regenerate the short link for "${link.campaignName}"? The old link will no longer work.`)) {
		        try {
		          // Assuming an API endpoint for regeneration exists
		          const response = await api.shorten.regenerate(link.id); 
		          // Update the selected link and refetch all data
		          setSelectedLink(response.link);
		          fetchData();
		          toast.success(`Link "${link.campaignName}" regenerated successfully!`);
		        } catch (error) {
		          toast.error(`Failed to regenerate link: ${error.message}`);
		        }
		      }
		    } else if (action === 'Select') {
		      setSelectedLink(link);
		    } else if (action === 'Delete') {
		      if (window.confirm(`Are you sure you want to delete the short link "${link.shortUrl}"?`)) {
		        try {
		          // Assuming the link object has an 'id' property
		          await api.shorten.delete(link.id); 
		          fetchData();
		          toast.success(`Link "${link.shortUrl}" deleted successfully.`);
		        } catch (error) {
		          toast.error(`Failed to delete link: ${error.message}`);
		        }
		      }
		    } else {
		      toast.info(`${action} action triggered for link: ${link.shortUrl}`);
		      // Mock action logic for other actions like Edit, View Analytics
		    }
		  };
		
		  const handleLinkUpdate = (updatedLink) => {
		    // Update the selected link and the list of links
		    setSelectedLink(updatedLink);
		    setLinks(prevLinks => prevLinks.map(l => l.id === updatedLink.id ? updatedLink : l));
		  };

  const filteredLinks = links.filter(link => {
    const matchesFilter = filter === 'all' || link.status === filter;
    const matchesSearch = !searchQuery ||
      link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const metricCards = [
    { title: 'Total Links', value: metrics.totalLinks.toLocaleString(), icon: Link },
    { title: 'Active Links', value: metrics.activeLinks.toLocaleString(), icon: Link },
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
  ];

	  const columns = [
	    {
	      header: 'Short Link',
	      accessor: 'shortUrl',
	      sortable: true,
	      cell: (row) => (
	        <div className="font-medium">
	          <a href={row.shortUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
	            {row.shortUrl}
	          </a>
	          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
	            row.status === 'active' ? 'bg-green-500/20 text-green-400' :
	            row.status === 'expired' ? 'bg-red-500/20 text-red-400' :
	            'bg-yellow-500/20 text-yellow-400'
	          }`}>
	            {row.status}
	          </span>
	        </div>
	      ),
	    },
	    {
	      header: 'Target URL',
	      accessor: 'targetUrl',
	      cell: (row) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{row.targetUrl}</span>,
	    },
	    {
	      header: 'Clicks',
	      accessor: 'clicks',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{row.clicks.toLocaleString()}</span>,
	    },
	    {
	      header: 'Created',
	      accessor: 'createdAt',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>,
	    },
	    {
	      header: 'Actions',
	      id: 'actions',
	      cell: ({ row }) => (
	        <ActionIconGroup
	          actions={[
	            { icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit', row.original) },
	            { icon: Copy, label: 'Copy Link', onClick: () => handleAction('Copy Link', row.original) },
	            { icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete', row.original) },
	          ]}
	        />
	      ),
	    },
	  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Link Shortener"
        description="Create, manage, and track your shortened links"
        actions={
          <Button onClick={handleCreateNewLink} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Link
          </Button>
        }
      />

      {/* Metric Cards */}
	      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
	        {metricCards.map((card, index) => (
	          <MetricCard key={index} {...card} />
	        ))}
	      </div>
	
	      {/* Enhanced Link Box Section */}
	      {selectedLink && (
	        <EnhancedLinkBox 
	          link={{
	            ...selectedLink,
	            trackingUrl: selectedLink.shortUrl, // Use shortUrl as the main tracking URL
	            pixelUrl: 'N/A (Shortener does not support pixel)', // Placeholder for shortener
	            emailCode: 'N/A (Shortener does not support email code)', // Placeholder for shortener
	            campaignName: selectedLink.shortUrl,
	            targetUrl: selectedLink.targetUrl,
	          }} 
	          onRegenerate={(link) => handleAction('Regenerate', link)}
	          onEdit={() => toast.info('Edit button clicked on EnhancedLinkBox')}
	          onLinkUpdate={handleLinkUpdate}
	        />
	      )}

      <FilterBar
        searchPlaceholder="Search links by short URL or target URL..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        onExport={() => toast.info('Exporting shortened links...')}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'expired', label: 'Expired' },
        ]}
        onFilterChange={setFilter}
        dateRangeOptions={[]} // Not typically needed for this view
        onDateRangeChange={() => {}}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Shortened Links</CardTitle>
          <p className="text-sm text-muted-foreground">List of all links created with the shortener</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Shortened Links...</div>
          ) : (
		            <DataTable
		              columns={columns}
		              data={filteredLinks}
		              pageSize={10}
		              actions={(row) => (
		                <div className="flex space-x-1">
		                  <ActionIconGroup
		                    actions={[
		                      { icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit', row) },
		                      { icon: Copy, label: 'Copy Link', onClick: () => handleAction('Copy Link', row) },
		                      { icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete', row) },
		                    ]}
		                  />
		                </div>
		              )}
			              expandedContent={(row) => (
			                <div className="p-4">
			                  <Button 
			                    variant="outline" 
			                    size="sm" 
			                    onClick={() => handleAction('Select', row)}
			                  >
			                    View in Enhanced Box
			                  </Button>
			                </div>
			              )}
			            />
          )}
        </CardContent>
      </Card>

      {/* Create New Link Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
	        <DialogContent className="sm:max-w-[600px] bg-card border-border">
	          <DialogHeader>
		            <DialogTitle className="text-foreground">Create New Short Link</DialogTitle>
          </DialogHeader>
	          	          <CreateLinkForm 
	            onClose={() => setIsCreateModalOpen(false)} 
	            onLinkCreated={fetchData} 
	            type="shortener" // Explicitly set type to shortener
	          />
	        </DialogContent>
		      </Dialog>
    </div>
  );
};

export default LinkShortener;
