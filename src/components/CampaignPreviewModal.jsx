import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Globe, Smartphone, MousePointer, Link as LinkIcon, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CampaignPreviewModal = ({ isOpen, onClose, campaign }) => {
    if (!campaign) return null;

    // Mock data for charts if not present (replace with real data from API)
    const clicksData = campaign.clicksOverTime || [
        { name: 'Mon', clicks: 400 },
        { name: 'Tue', clicks: 300 },
        { name: 'Wed', clicks: 550 },
        { name: 'Thu', clicks: 450 },
        { name: 'Fri', clicks: 600 },
        { name: 'Sat', clicks: 200 },
        { name: 'Sun', clicks: 300 },
    ];

    const deviceData = campaign.deviceUsage || [
        { name: 'Mobile', value: 400 },
        { name: 'Desktop', value: 300 },
        { name: 'Tablet', value: 100 },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {campaign.name}
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Campaign Overview & Performance Analytics
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Key Metrics */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Clicks</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaign.totalClicks?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Visitors</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaign.totalVisitors?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground">+10.5% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Conversion Rate</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaign.conversionRate || '0%'}</div>
                            <p className="text-xs text-muted-foreground">+2.4% from last month</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Clicks Over Time Chart */}
                    <Card className="col-span-1">
                        <CardHeader><CardTitle>Clicks Over Time</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={clicksData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="clicks" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Device Usage Chart */}
                    <Card className="col-span-1">
                        <CardHeader><CardTitle>Device Usage</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Links Included */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Links Included</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-4">
                                    {campaign.links && campaign.links.length > 0 ? (
                                        campaign.links.map((link, index) => (
                                            <div key={index} className="flex items-center justify-between border-b pb-2">
                                                <div>
                                                    <p className="font-medium">{link.title || 'Untitled Link'}</p>
                                                    <p className="text-xs text-muted-foreground">{link.url}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold">{link.clicks || 0}</p>
                                                    <p className="text-xs text-muted-foreground">clicks</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No links in this campaign.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span>New click from <strong>United States</strong> on Link #{i + 1}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">2m ago</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CampaignPreviewModal;
