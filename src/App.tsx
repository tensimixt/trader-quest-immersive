
import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./components/WalletProvider";
import { Toaster } from "@/components/ui/toaster";
import { TabProvider } from "./context/TabContext";
import "./App.css";
import Index from "./pages/Index";

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <TabProvider>
          <Index />
          <Toaster />
        </TabProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
