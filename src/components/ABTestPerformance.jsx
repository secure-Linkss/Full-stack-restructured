import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TestTube, TrendingUp, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/Badge';



const ABTestPerformance = () => {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for A/B test performance
      const response = await api.analytics.getABTestPerformance();
      setTestData(response.testData || []);
      toast.success('A/B test data loaded.');
    } catch (error) {
      console.error('Error fetching A/B test data:', error);
      toast.error('Failed to load A/B test data. Check API connection.');
      setTestData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><TestTube className="h-5 w-5 mr-2 text-primary" /> A/B Test Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Compare the performance of your active and completed A/B tests.</p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
	        ) : testData.length > 0 ? (
	          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
                <TableHead className="text-center">Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testData.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell>
                    <Badge variant={test.status === 'Active' ? 'default' : 'secondary'}>{test.status}</Badge>
                  </TableCell>
                  <TableCell>{test.clicks.toLocaleString()}</TableCell>
                  <TableCell>{test.conversions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold text-green-400">{test.rate.toFixed(2)}%</TableCell>
                  <TableCell className="text-center">
                    {test.winner ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-red-500 mx-auto" />}
                  </TableCell>
                </TableRow>
	              ))}
	            </TableBody>
	          </Table>
	        ) : (
	          <div className="h-64 flex items-center justify-center">
	            <p className="text-muted-foreground">No A/B test data available for the selected period.</p>
	          </div>
	        )}
	        <div className="p-4 border-t">
	          <Button variant="link" className="p-0">View All Test History</Button>
	        </div>
	      </CardContent>
    </Card>
  );
};

export default ABTestPerformance;
