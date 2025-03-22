
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SolanaWalletProvider } from "./components/WalletProvider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import AdaptiveInsight from "./components/AdaptiveInsight";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import TweetAnalyzer from "./pages/TweetAnalyzer";

const queryClient = new QueryClient();

// Sample insights for demonstration purposes
const sampleInsights = [
  {
    title: "BTC Price Spike Detected",
    description: "Bitcoin just jumped 3.5% in the last 15 minutes. Unusual volume detected.",
    type: "price_spike",
    symbol: "BTC",
    change: 3.5,
    severity: "medium"
  },
  {
    title: "Market Sentiment Shift",
    description: "Overall market sentiment turning bullish across major tokens.",
    type: "market_event",
    symbol: "MARKET",
    change: 2.1,
    severity: "low"
  },
  {
    title: "Whale Alert: ETH",
    description: "Large ETH transfer detected. 5000 ETH moved to exchange.",
    type: "whale_alert",
    symbol: "ETH",
    change: -1.2,
    severity: "high"
  }
];

const Navigation = () => (
  <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md p-2 flex justify-center space-x-3 z-50">
    <Link to="/">
      <Button variant="navlink" size="xs" className="font-medium">Dashboard</Button>
    </Link>
    <Link to="/tweet-analyzer">
      <Button variant="navlink" size="xs" className="font-medium">Tweet Analyzer</Button>
    </Link>
    <Link to="/admin">
      <Button variant="navlink" size="xs" className="font-medium">Admin</Button>
    </Link>
  </div>
);

const App = () => {
  const [insight, setInsight] = useState<null | {
    title: string;
    description: string;
    type: string;
    symbol: string;
    change: number;
    severity: string;
  }>(null);

  useEffect(() => {
    // For demonstration purposes, randomly show an insight after a short delay
    const timer = setTimeout(() => {
      const randomInsight = sampleInsights[Math.floor(Math.random() * sampleInsights.length)];
      setInsight(randomInsight);
      
      // Auto-dismiss after 8 seconds
      const dismissTimer = setTimeout(() => {
        setInsight(null);
      }, 8000);
      
      return () => clearTimeout(dismissTimer);
    }, 3000); // Show insight 3 seconds after page load
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SolanaWalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col h-screen overflow-hidden">
              <Navigation />
              <div className="flex-1 overflow-hidden pt-12">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/tweet-analyzer" element={<TweetAnalyzer />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              
              {/* Adaptive Insight Component */}
              {insight && (
                <AdaptiveInsight
                  insight={insight}
                  onDismiss={() => setInsight(null)}
                />
              )}
            </div>
          </BrowserRouter>
        </SolanaWalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
