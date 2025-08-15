import React from 'react';
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react';

const SearchFilter = () => {
    return (
        <div className='flex gap-2 items-center'>
            <div className="relative w-full bg-fade-background focus-within:border-[#0000001F] focus-within:ring-2 focus-within:ring-primary/20 transition-colors rounded-xl py-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search size={16} />
                </span>
                <Input
                    type="text"
                    placeholder="Search"
                    className="pl-10 bg-transparent outline-none border-none shadow-none text-left focus-visible:ring-0 focus-visible:border-none text-sm placeholder:text-sm"
                />
            </div>
        </div>
    );
};

export { SearchFilter };