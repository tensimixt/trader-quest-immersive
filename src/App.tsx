
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SolanaWalletProvider } from "./components/WalletProvider";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import TweetAnalyzer from "./pages/TweetAnalyzer";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SolanaWalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col h-screen overflow-hidden">
            <Navigation />
            <div className="flex-1 overflow-hidden pt-12"> {/* Changed from pt-16 to pt-12 and added overflow-hidden */}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/tweet-analyzer" element={<TweetAnalyzer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </SolanaWalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
