
import React from 'react';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput = ({ value, onChange, onSubmit }: ChatInputProps) => {
  return (
    <form onSubmit={onSubmit} className="relative">
      <Input
        type="text"
        placeholder="Enter command, Master Wayne..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border-emerald-500/20 text-white placeholder:text-emerald-500/50"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
