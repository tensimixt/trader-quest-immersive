
import React, { createContext, useContext, useState } from 'react';

type TabContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => Promise<void>;
  isTransitioning: boolean;
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = async (tab: string) => {
    setIsTransitioning(true);
    setActiveTab(tab);
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsTransitioning(false);
  };

  return (
    <TabContext.Provider value={{ 
      activeTab, 
      setActiveTab: handleTabChange,
      isTransitioning 
    }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
}
