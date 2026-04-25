import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Globe, MapPin, RefreshCw, Filter } from 'lucide-react';
import InteractiveMap from './ui/InteractiveMap';

import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import api from '../services/api';
import { toast } from 'sonner';



// --- Map Component ---
const WorldMap = ({ data }) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardContent className="h-[600px] p-0">
        <InteractiveMap data={data} />
      </CardContent>
    </Card>
  );
};

// --- Main Geography Component ---
const Geography = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCountries: 0,
    topCountryClicks: 0,
    topCountryVisitors: 0,
    totalCities: 0
  });
  const [countryData, setCountryData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.geography.getAnalytics(dateRange);
      if (response.success) {
        setMetrics(response.metrics || {
          totalCountries: 0,
          topCountryClicks: 0,
          topCountryVisitors: 0,
          totalCities: 0
        });
        // Normalize country data — InteractiveMap needs coordinates: [lng, lat]
        const normalized = (response.countries || []).map(c => ({
          ...c,
          name: c.country || c.name || '',
          clicks: c.clicks || c.total_clicks || 0,
          visitors: c.visitors || c.unique_visitors || 0,
          coordinates: c.coordinates || (
            (c.lng != null && c.lat != null) ? [c.lng, c.lat] :
            (c.longitude != null && c.latitude != null) ? [c.longitude, c.latitude] : null
          ),
        }));
        setCountryData(normalized);
      }
    } catch (error) {
      console.error('Error fetching geography data:', error);
      toast.error('Failed to load geography data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleExport = () => {
    if (!countryData || countryData.length === 0) {
      toast.error('No data to export.');
      return;
    }
    const headers = ['Country', 'Country Code', 'Clicks', 'Visitors', 'Percentage'];
    const rows = countryData.map(row => [
      row.country || row.name || '',
      row.country_code || row.code || '',
      row.clicks || row.total_clicks || 0,
      row.visitors || row.unique_visitors || 0,
      row.percentage || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geography-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Geography data exported.');
  };

  const metricCards = [
    { title: 'Total Countries', value: metrics.totalCountries, icon: Globe, change: 0.0 },
    { title: 'Top Country Clicks', value: metrics.topCountryClicks?.toLocaleString(), icon: MapPin, change: 1.2 },
    { title: 'Top Country Visitors', value: metrics.topCountryVisitors?.toLocaleString(), icon: MapPin, change: 0.8 },
    { title: 'Total Cities', value: metrics.totalCities?.toLocaleString(), icon: MapPin, change: 0.0 },
  ];

  const columns = [
    {
      header: 'Country',
      accessor: 'country',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <span className="mr-2 text-lg">{row.flag || '🌍'}</span>
          <span className="font-medium">{row.country || row.name}</span>
        </div>
      ),
    },
    {
      header: 'Clicks',
      accessor: 'clicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.clicks || 0).toLocaleString()}</span>,
    },
    {
      header: 'Visitors',
      accessor: 'visitors',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.visitors || 0).toLocaleString()}</span>,
    },
    {
      header: 'Emails Captured',
      accessor: 'emailsCaptured',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.emailsCaptured || 0).toLocaleString()}</span>,
    },
    {
      header: 'Conversion Rate',
      accessor: 'conversionRate',
      sortable: true,
      cell: (row) => <span className="text-sm">{Math.round((row.conversionRate || 0) * 100)}%</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geography Analytics"
        description="Analyze traffic distribution and performance by geographic location"
      />

      <FilterBar
        searchPlaceholder="Search country or city..."
        onSearch={() => { }}
        onRefresh={handleRefresh}
        onExport={handleExport}
        dateRangeOptions={['7d', '30d', '90d']}
        onDateRangeChange={handleDateRangeChange}
        selectedDateRange={dateRange}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      {loading ? (
        <div className="text-center text-muted-foreground p-10">Loading Geography Data...</div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricCards.map((card, index) => (
              <MetricCard key={index} {...card} />
            ))}
          </div>

          {/* Map and Top Countries Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <WorldMap data={countryData.map(c => ({ name: c.name, clicks: c.clicks, coordinates: c.coordinates }))} />
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Countries</CardTitle>
                <p className="text-sm text-muted-foreground">Highest performing locations</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {countryData.slice(0, 5).map((country, index) => (
                    <li key={index} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{country.flag || '🌍'}</span>
                        <span className="font-medium">{country.country || country.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{(country.clicks || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{Math.round((country.conversionRate || 0) * 100)}% CR</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Country Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Geographic Data</CardTitle>
              <p className="text-sm text-muted-foreground">All tracked countries and their metrics</p>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={countryData}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Geography;