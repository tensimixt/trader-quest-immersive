
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Network } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatSectionProps {
  chatHistory: Array<{
    message: string;
    timestamp: string;
    isUser?: boolean;
    type?: 'chat' | 'intel' | 'history';
    contextData?: {
      showChart?: boolean;
      showCalls?: boolean;
    };
  }>;
  userInput: string;
  onUserInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  showIntel?: boolean;
  isThinking?: boolean;
  onViewChart?: () => void;
}

const ChatSection = ({ 
  chatHistory, 
  userInput, 
  onUserInput, 
  onSubmit, 
  containerRef,
  showIntel = false,
  isThinking = false,
  onViewChart
}: ChatSectionProps) => {
  return (
    <div className="absolute inset-0 flex flex-col">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-4 bg-black/40 border border-emerald-500/20">
          <TabsTrigger 
            value="chat"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="intel"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20"
          >
            <Network className="w-4 h-4" />
            Market Intel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20 px-2"
          >
            {chatHistory
              .filter(msg => msg.type !== 'intel')
              .map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg.message}
                  timestamp={msg.timestamp}
                  isUser={msg.isUser}
                  type={msg.type}
                  onViewChart={onViewChart}
                />
              ))}
            {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-black/50 backdrop-blur-sm border-t border-emerald-500/20">
            <ChatInput
              value={userInput}
              onChange={onUserInput}
              onSubmit={onSubmit}
            />
          </div>
        </TabsContent>

        <TabsContent value="intel" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-4 px-2">
            {chatHistory
              .filter(msg => msg.type === 'intel')
              .map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg.message}
                  timestamp={msg.timestamp}
                  isUser={msg.isUser}
                  type={msg.type}
                  onViewChart={onViewChart}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatSection;

