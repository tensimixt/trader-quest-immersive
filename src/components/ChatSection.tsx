
import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

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
  const filteredMessages = chatHistory.filter(msg => 
    showIntel ? msg.type === 'intel' : msg.type !== 'intel'
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {filteredMessages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg.message}
            timestamp={msg.timestamp}
            isUser={msg.isUser}
            type={msg.type}
            onViewChart={onViewChart}
            isThinking={false}
          />
        ))}
        {isThinking && <ChatMessage message="" timestamp="" isThinking={true} />}
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-black/40 p-4 backdrop-blur-sm border-t border-emerald-500/10">
        <ChatInput
          value={userInput}
          onChange={onUserInput}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};

export default ChatSection;
