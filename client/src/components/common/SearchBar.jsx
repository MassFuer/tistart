import React, { useState, useEffect } from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchBar = ({ value, onSearch, placeholder = "Search..." }) => {
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (input !== value) {
        onSearch(input);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [input, onSearch, value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="pl-9" // Add padding left for icon
      />
    </div>
  );
};

export default SearchBar;
