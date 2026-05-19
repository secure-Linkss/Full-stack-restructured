import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const glass = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const FlowNode = ({ node, allNodes, index }) => {
  const nextNode = allNodes.find(n => n.id === node.next);
  const dropOff = nextNode ? ((node.visitors - nextNode.visitors) / node.visitors * 100) : 0;
  const isLast = !node.next;

  return (
    <div className="flex items-center gap-4 shrink-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="flex flex-col items-center"
      >
        <div
          className="px-4 py-3 rounded-[10px] text-center w-44"
          style={{
            background: isLast ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${isLast ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.2)'}`,
          }}
        >
          <p className="text-xs font-semibold text-white">{node.label}</p>
          <p className="text-lg font-bold mt-1" style={{ color: isLast ? '#34d399' : '#60a5fa' }}>
            {node.visitors.toLocaleString()}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>visitors</p>
        </div>
      </motion.div>

      {node.next && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.1 }}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <ArrowRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'rgba(239,68,68,0.7)' }}>
            -{dropOff.toFixed(1)}%
          </span>
        </motion.div>
      )}
    </div>
  );
};

const VisitorBehaviorFlow = () => {
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlowData = async () => {
    setLoading(true);
    try {
      const response = await api.analytics.getVisitorFlow();
      setFlowData(response.flowData || []);
    } catch {
      toast.error('Failed to load visitor flow data.');
      setFlowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlowData(); }, []);

  return (
    <div style={{ ...glass }} className="lg:col-span-2">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <GitBranch className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Visitor Behavioral Flow</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Path from source to conversion</p>
          </div>
        </div>
        <button
          onClick={fetchFlowData}
          disabled={loading}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400/70 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-6 min-h-[200px] flex items-center">
        {loading ? (
          <div className="flex items-center justify-center w-full py-10">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
          </div>
        ) : flowData.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-10 gap-3">
            <GitBranch className="w-8 h-8 text-blue-400/30" />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No visitor flow data available.</p>
          </div>
        ) : (
          <div className="flex items-center gap-0 overflow-x-auto pb-2 w-full">
            {flowData.map((node, i) => (
              <FlowNode key={node.id} node={node} allNodes={flowData} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorBehaviorFlow;
