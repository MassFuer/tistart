import React, { useState, useEffect } from 'react';

/**
 * SearchBar component with 300ms debounce.
 * Props:
 *  - value: current search string
 *  - onSearch: (value) => void callback when debounced value changes
 */
const SearchBar = ({ value, onSearch }) => {
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(input);
    }, 300);
    return () => clearTimeout(handler);
  }, [input, onSearch]);

  return (
    <input
      type="text"
      placeholder="Search events..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="search-input"
    />
  );
};

export default SearchBar;
