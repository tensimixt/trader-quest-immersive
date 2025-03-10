
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
  <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md p-3 flex justify-center space-x-4 z-50">
    <Link to="/">
      <Button variant="navlink" size="sm">Dashboard</Button>
    </Link>
    <Link to="/tweet-analyzer">
      <Button variant="navlink" size="sm">Tweet Analyzer</Button>
    </Link>
    <Link to="/admin">
      <Button variant="navlink" size="sm">Admin</Button>
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
          <Navigation />
          <div className="pt-16"> {/* Add padding to account for the fixed navigation */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/tweet-analyzer" element={<TweetAnalyzer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </SolanaWalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
