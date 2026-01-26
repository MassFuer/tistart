import React, { useState, useEffect } from 'react';
import { FaSearch } from "react-icons/fa";
import './SearchBar.css';

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
    <div className="search-input-wrapper">
      <FaSearch className="search-icon" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;
