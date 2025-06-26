import React from 'react';
import { Input } from "@/components/ui/input"
import { ListFilter, Search } from 'lucide-react';


const SearchFilter = () => {
    return (
        <div className='flex gap-2 items-center'>
            <div className="relative w-full bg-fade-background rounded-xl py-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search size={18} />
                </span>
                <Input
                    type="text"
                    placeholder="Search"
                    className="pl-10"
                />
            </div>
            <div className='bg-fade-background py-3 px-4 rounded-lg'>
                <ListFilter />
            </div>
        </div>
    );
};

export default SearchFilter;