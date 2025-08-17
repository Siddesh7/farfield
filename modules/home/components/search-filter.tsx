import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Search, X } from 'lucide-react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
  searchQuery: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  onSearch, 
  onClear, 
  isSearching, 
  searchQuery 
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className='flex gap-2 items-center'>
      <div className="relative w-full bg-fade-background focus-within:border-[#0000001F] focus-within:ring-2 focus-within:ring-primary/20 transition-colors rounded-xl py-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search size={16} />
        </span>
        <Input
          type="text"
          placeholder="Search products..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-10 pr-10 bg-transparent outline-none border-none shadow-none text-left focus-visible:ring-0 focus-visible:border-none text-sm placeholder:text-sm"
        />
        {(isSearching || searchQuery) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
};

export { SearchFilter };