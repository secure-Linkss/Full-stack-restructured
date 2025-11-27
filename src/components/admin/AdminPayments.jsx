import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, RefreshCw, DollarSign, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import MetricCard from '@/components/ui/MetricCard';
import api from '../../services/api';

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transactionsData, subscriptionsData] = await Promise.all([
        api.adminPayments.getTransactions(),
        api.adminPayments.getSubscriptions(),
      ]);

      setTransactions(transactionsData.transactions || []);

      // Calculate metrics from real data
      const totalRevenue = (transactionsData.transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalTransactions = (transactionsData.transactions || []).length;
      const activeSubscriptions = (subscriptionsData.subscriptions || []).filter(s => s.status === 'active').length;

      setMetrics({
        totalRevenue,
        totalTransactions,
        activeSubscriptions
      });

      toast.success('Payment data refreshed.');
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data.');
      setTransactions([]);
      setMetrics({ totalRevenue: 0, totalTransactions: 0, activeSubscriptions: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metricCards = [
    { title: 'Total Revenue', value: `$${metrics.totalRevenue?.toLocaleString()}`, icon: DollarSign },
    { title: 'Total Transactions', value: metrics.totalTransactions?.toLocaleString(), icon: Receipt },
    { title: 'Active Subscriptions', value: metrics.activeSubscriptions?.toLocaleString(), icon: Users },
  ];

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'id',
      cell: (row) => <code className="text-sm text-muted-foreground">{row.id}</code>,
    },
    {
      header: 'User',
      accessor: 'userEmail',
      cell: (row) => <span className="font-medium">{row.userEmail}</span>,
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => <span className="text-sm font-semibold text-green-500">${row.amount.toFixed(2)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${row.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
          }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.date).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CreditCard className="h-5 w-5 mr-2 text-primary" /> Payments & Billing</CardTitle>
          <p className="text-sm text-muted-foreground">Manage payment gateways, subscriptions, and view transactions.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricCards.map((card, index) => (
              <MetricCard key={index} {...card} />
            ))}
          </div>

          {/* Transactions Table */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Transactions...</div>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
