import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Plus, Link, Copy, RefreshCw, Trash2, Edit, Play, Pause, ExternalLink, Filter, Users, BarChart3, Eye, Shield } from 'lucide-react';
import EnhancedLinkBox from './EnhancedLinkBox';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import CreateLinkForm from './forms/CreateLink'; // Placeholder for the new form component



// --- Main Component ---
const TrackingLinks = () => {
	const [links, setLinks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [metrics, setMetrics] = useState({ totalClicks: 0, realVisitors: 0, botsBlocked: 0 });
	const [selectedLink, setSelectedLink] = useState(null); // State for the link to display in the box

	const fetchData = async () => {
		setLoading(true);
		try {
			const response = await api.links.getAll();
			const linksData = Array.isArray(response) ? response : (response.links || []);
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

			// Calculate metrics from the fetched links data
			const totalClicks = linksData.reduce((sum, link) => sum + (link.totalClicks || link.total_clicks || 0), 0);
			const realVisitors = linksData.reduce((sum, link) => sum + (link.realVisitors || link.real_visitors || 0), 0);
			const botsBlocked = linksData.reduce((sum, link) => sum + (link.botsBlocked || link.bots_blocked || 0), 0);
			setMetrics({ totalClicks, realVisitors, botsBlocked });

			toast.success('Tracking links refreshed.');
		} catch (error) {
			console.error('Error fetching links:', error);
			toast.error('Failed to load tracking links.');
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
			if (window.confirm(`Are you sure you want to regenerate the tracking link for "${link.campaignName}"? The old link will no longer work.`)) {
				try {
					// Assuming an API endpoint for regeneration exists
					const response = await api.links.regenerate(link.id);
					// Update the selected link and refetch all data
					setSelectedLink(response.link);
					fetchData();
					toast.success(`Link "${link.campaignName}" regenerated successfully!`);
				} catch (error) {
					toast.error(`Failed to regenerate link: ${error.message}`);
				}
			}
		} else if (action === 'Edit') {
			// Placeholder for opening an edit modal
			toast.info(`Edit action triggered for link: ${link.campaignName}`);
			// You would typically open a modal here and pass the link object
			// setIsEditModalOpen(true);
			// setSelectedLink(link);
		} else if (action === 'Copy') {
			// Placeholder for copying the link
			toast.info(`Copy action triggered for link: ${link.campaignName}`);
			// You would typically call an API to duplicate the link
			// api.links.copy(link.id);
		} else if (action === 'Delete') {
			if (window.confirm(`Are you sure you want to delete the link "${link.campaignName}"?`)) {
				try {
					await api.links.delete(link.id);
					fetchData();
					toast.success(`Link "${link.campaignName}" deleted successfully.`);
				} catch (error) {
					toast.error(`Failed to delete link: ${error.message}`);
				}
			}
		} else if (action === 'Select') {
			setSelectedLink(link);
		} else {
			toast.info(`${action} action triggered for link: ${link.campaignName}`);
			// Mock action logic for other actions like Edit, Toggle Status
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
			link.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesFilter && matchesSearch;
	});

	const metricCards = [
		{ title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
		{ title: 'Real Visitors', value: metrics.realVisitors.toLocaleString(), icon: Users },
		{ title: 'Bots Blocked', value: metrics.botsBlocked.toLocaleString(), icon: Shield },
	];

	const columns = [
		{
			header: 'Campaign Name',
			accessor: 'campaignName',
			sortable: true,
			cell: (row) => (
				<div className="font-medium">
					{row.campaignName}
					<span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${row.status === 'active' ? 'bg-green-500/20 text-green-400' :
						row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
							'bg-red-500/20 text-red-400'
						}`}>
						{row.status}
					</span>
				</div>
			),
		},
		{
			header: 'Target URL',
			accessor: 'targetUrl',
			cell: (row) => <a href={row.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{row.targetUrl}</a>,
		},
		{
			header: 'Clicks',
			accessor: 'totalClicks',
			sortable: true,
			cell: (row) => <span className="text-sm">{row.totalClicks.toLocaleString()}</span>,
		},
		{
			header: 'Actions',
			accessor: 'actions',
			cell: (row) => (
				<ActionIconGroup
					actions={[
						{ icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit', row) },
						{ icon: Copy, label: 'Copy Link', onClick: () => handleAction('Copy', row) },
						{ icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete', row) },
					]}
				/>
			),
		},
		{
			header: 'Real Visitors',
			accessor: 'realVisitors',
			sortable: true,
			cell: (row) => <span className="text-sm">{row.realVisitors.toLocaleString()}</span>,
		},
		{
			header: 'Bots Blocked',
			accessor: 'botsBlocked',
			sortable: true,
			cell: (row) => <span className="text-sm">{row.botsBlocked.toLocaleString()}</span>,
		},
		{
			header: 'Status',
			accessor: 'status',
			cell: (row) => (
				<span className={`px-2 py-1 text-xs font-medium rounded-full ${row.status === 'active' ? 'bg-green-500/20 text-green-400' :
					row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
						'bg-red-500/20 text-red-400'
					}`}>
					{row.status}
				</span>
			),
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Tracking Links"
				description="Create and manage your tracking links"
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
					link={selectedLink}
					onRegenerate={(link) => handleAction('Regenerate', link)}
					onEdit={() => toast.info('Edit button clicked on EnhancedLinkBox')}
					onLinkUpdate={handleLinkUpdate}
				/>
			)}

			<FilterBar
				searchPlaceholder="Search links..."
				onSearch={setSearchQuery}
				onRefresh={handleRefresh}
				onExport={() => toast.info('Exporting links...')}
				filterOptions={[
					{ value: 'all', label: 'All' },
					{ value: 'active', label: 'Active' },
					{ value: 'paused', label: 'Paused' },
					{ value: 'expired', label: 'Expired' },
				]}
				onFilterChange={setFilter}
				dateRangeOptions={[]} // Not needed for this view
				onDateRangeChange={() => { }}
				extraButtons={[
					<Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
						<Filter className="h-4 w-4 mr-2" />
						Filters
					</Button>
				]}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Your Tracking Links</CardTitle>
					<p className="text-sm text-muted-foreground">Manage and monitor your tracking links</p>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center text-muted-foreground p-10">Loading Tracking Links...</div>
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
											{ icon: row.status === 'active' ? Pause : Play, label: row.status === 'active' ? 'Pause Link' : 'Activate Link', onClick: () => handleAction('Toggle Status', row) },
											{ icon: RefreshCw, label: 'Regenerate Link', onClick: () => handleAction('Regenerate', row) },
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
						<DialogTitle className="text-foreground">Create New Tracking Link</DialogTitle>
					</DialogHeader>
					<CreateLinkForm
						onClose={() => setIsCreateModalOpen(false)}
						onLinkCreated={fetchData}
						type="tracking"
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default TrackingLinks;
