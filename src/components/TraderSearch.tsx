
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TraderSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const TraderSearch = ({ searchQuery, setSearchQuery }: TraderSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400/50 w-4 h-4" />
      <Input
        type="text"
        placeholder="Search traders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 bg-black/20 border-emerald-500/20 text-emerald-400 placeholder:text-emerald-400/30"
      />
    </div>
  );
};

export default TraderSearch;
