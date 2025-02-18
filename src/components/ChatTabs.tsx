
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, History } from 'lucide-react';

interface ChatTabsProps {
  children?: React.ReactNode;
}

const ChatTabs = ({ children }: ChatTabsProps) => {
  return (
    <Tabs defaultValue="chat" className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <TabsList className="bg-black/20 border border-emerald-500/20">
          <TabsTrigger value="chat" className="data-[state=active]:bg-emerald-500/20">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-500/20">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};

export default ChatTabs;
