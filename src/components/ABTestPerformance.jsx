import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TestTube, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const glass = {
  background: 'rgba(8,15,35,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
};

const ABTestPerformance = () => {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      const response = await api.analytics.getABTestPerformance();
      setTestData(response.testData || []);
    } catch {
      toast.error('Failed to load A/B test data.');
      setTestData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTestData(); }, []);

  return (
    <div style={glass}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
            <TestTube className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">A/B Test Performance</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Active and completed test results</p>
          </div>
        </div>
        <button
          onClick={fetchTestData}
          disabled={loading}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-violet-400/70 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
            </div>
          </div>
        ) : testData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TestTube className="w-8 h-8 text-violet-400/30" />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No A/B test data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Test Name', 'Status', 'Clicks', 'Conversions', 'Conv. Rate', 'Winner'].map(h => (
                    <th key={h} className="pb-3 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testData.map((test, i) => (
                  <motion.tr
                    key={test.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="py-3 font-medium text-white">{test.name}</td>
                    <td className="py-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={test.status === 'Active'
                          ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                        }
                      >
                        {test.status}
                      </span>
                    </td>
                    <td className="py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{test.clicks?.toLocaleString()}</td>
                    <td className="py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{test.conversions?.toLocaleString()}</td>
                    <td className="py-3 font-semibold text-emerald-400">{test.rate?.toFixed(2)}%</td>
                    <td className="py-3 text-center">
                      {test.winner
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        : <XCircle className="w-4 h-4 mx-auto" style={{ color: 'rgba(239,68,68,0.5)' }} />
                      }
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestPerformance;
