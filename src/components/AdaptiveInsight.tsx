
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, TrendingDown, Info, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AdaptiveInsightProps {
  isVisible: boolean;
  onClose: () => void;
  insight: {
    title: string;
    description: string;
    type: 'price_spike' | 'trader_call' | 'market_event' | 'info';
    symbol?: string;
    change?: number;
    severity?: 'low' | 'medium' | 'high';
  };
}

const AdaptiveInsight: React.FC<AdaptiveInsightProps> = ({
  isVisible,
  onClose,
  insight
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Auto-close after 15 seconds if not expanded
  useEffect(() => {
    if (isVisible && !expanded) {
      const timer = setTimeout(() => {
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, expanded, onClose]);

  const getIcon = () => {
    switch (insight.type) {
      case 'price_spike':
        return insight.change && insight.change > 0 
          ? <TrendingUp className="w-5 h-5 text-emerald-400" /> 
          : <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'trader_call':
        return <BarChart2 className="w-5 h-5 text-blue-400" />;
      case 'market_event':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-purple-400" />;
    }
  };

  const getBorderColor = () => {
    switch (insight.type) {
      case 'price_spike':
        return insight.change && insight.change > 0 
          ? 'border-emerald-500/30' 
          : 'border-red-500/30';
      case 'trader_call':
        return 'border-blue-500/30';
      case 'market_event':
        return 'border-amber-500/30';
      default:
        return 'border-purple-500/30';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className={`fixed bottom-4 right-4 z-50 max-w-sm ${expanded ? 'w-96' : 'w-80'}`}
        >
          <div className={`glass-card rounded-xl border ${getBorderColor()} overflow-hidden shadow-lg`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getIcon()}
                  <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="h-6 w-6 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-white/70" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-white/80">{insight.description}</p>
                
                {expanded && insight.symbol && (
                  <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-white/70">Symbol</span>
                      <span className="text-sm font-bold text-white">{insight.symbol}</span>
                    </div>
                    {insight.change !== undefined && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-mono text-white/70">Change</span>
                        <span className={`text-sm font-bold ${insight.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {insight.change > 0 ? '+' : ''}{insight.change}%
                        </span>
                      </div>
                    )}
                    {insight.severity && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-mono text-white/70">Severity</span>
                        <span className={`text-sm font-bold ${
                          insight.severity === 'high' ? 'text-red-400' : 
                          insight.severity === 'medium' ? 'text-amber-400' : 
                          'text-blue-400'
                        }`}>
                          {insight.severity.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    {expanded ? 'Show Less' : 'Show More'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => {
                      onClose();
                      // Here we could navigate to relevant section or open a detailed view
                      console.log('Action button clicked for insight:', insight);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdaptiveInsight;
