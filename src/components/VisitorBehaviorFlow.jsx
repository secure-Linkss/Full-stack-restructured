import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GitBranch, ArrowRight, Loader } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const FlowNode = ({ node, allNodes }) => {
  const nextNode = allNodes.find(n => n.id === node.next);
  const dropOff = nextNode ? ((node.visitors - nextNode.visitors) / node.visitors * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 border border-primary text-primary-foreground p-4 rounded-lg shadow-lg w-48 text-center">
        <p className="font-semibold">{node.label}</p>
        <p className="text-sm mt-1">{node.visitors.toLocaleString()} Visitors</p>
      </div>
      {node.next && (
        <div className="flex flex-col items-center my-2">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
          <span className="text-xs text-muted-foreground">Drop-off: {dropOff.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

const VisitorBehaviorFlow = () => {
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Connect to the live API for complex flow data
  const fetchFlowData = async () => {
    setLoading(true);
    try {
      // Assuming a new API endpoint for visitor flow
      const response = await api.analytics.getVisitorFlow(); 
      setFlowData(response.flowData || []);
      toast.success('Visitor flow data loaded.');
    } catch (error) {
      console.error('Error fetching visitor flow:', error);
      toast.error('Failed to load visitor flow data. Check API connection.');
      setFlowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowData();
  }, []);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center"><GitBranch className="h-5 w-5 mr-2 text-primary" /> Visitor Behavioral Flow</CardTitle>
        <p className="text-sm text-muted-foreground">Visualize the path users take from source to conversion.</p>
      </CardHeader>
      <CardContent className="min-h-64 flex flex-col items-center justify-center p-6">
        {loading ? (
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : flowData.length > 0 ? (
          <div className="flex items-start space-x-8 overflow-x-auto">
            {flowData.map(node => (
              <FlowNode key={node.id} node={node} allNodes={flowData} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No visitor flow data available for the selected period.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitorBehaviorFlow;
