import React, { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';

/**
 * High-performance, accessible Search-as-you-type input with dropdown suggestions.
 * Supports both single-value inputs (e.g. Degree) and comma-separated token lists (e.g. Skills).
 */
export default function SearchAsYouTypeInput({
  value = '',
  onChange,
  suggestions = [],
  placeholder = '',
  isMulti = false,
  className = '',
  maxSuggestions = 6,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Extract the active query segment
  const getActiveQuery = () => {
    if (!isMulti) return value.trim().toLowerCase();
    const parts = value.split(',');
    return (parts[parts.length - 1] || '').trim().toLowerCase();
  };

  const activeQuery = getActiveQuery();

  // Already selected items in multi-value mode
  const selectedItems = isMulti
    ? value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  // Filter suggestions
  const filteredSuggestions = suggestions.filter((item) => {
    const itemLower = item.toLowerCase();
    if (isMulti && selectedItems.includes(itemLower)) {
      return false;
    }
    if (!activeQuery) return false;
    return itemLower.includes(activeQuery);
  }).slice(0, maxSuggestions);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleSelectSuggestion = (selectedText) => {
    if (isMulti) {
      const parts = value.split(',');
      const priorParts = parts.slice(0, parts.length - 1).map((p) => p.trim()).filter(Boolean);
      const newParts = [...priorParts, selectedText];
      onChange(newParts.join(', ') + ', ');
    } else {
      onChange(selectedText);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + query.length);
    const after = text.substring(idx + query.length);
    return (
      <>
        {before}
        <strong className="sayt-match-highlight">{match}</strong>
        {after}
      </>
    );
  };

  return (
    <div className="sayt-container" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className={`auth-input sayt-input ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => {
          if (filteredSuggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        required={required}
        autoComplete="off"
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="sayt-dropdown animate-scale-in">
          <div className="sayt-dropdown-header">
            <Search size={12} />
            <span>Suggested Matches (Press Tab or Enter to select)</span>
          </div>
          <ul className="sayt-list" role="listbox">
            {filteredSuggestions.map((item, idx) => (
              <li
                key={item}
                role="option"
                aria-selected={idx === highlightedIndex}
                className={`sayt-item ${idx === highlightedIndex ? 'active' : ''}`}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handleSelectSuggestion(item)}
              >
                <span className="sayt-item-text">
                  {highlightMatch(item, activeQuery)}
                </span>
                <span className="sayt-action-hint">
                  <Check size={13} className="sayt-check-icon" />
                  <span>Select</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
