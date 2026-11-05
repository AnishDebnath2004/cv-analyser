import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { COUNTRY_CALLING_CODES } from '../utils/countryCodes';

/**
 * Searchable International Country Calling Code picker.
 * Features an integrated real-time search input, country flags, dialing codes, and outside-click detection.
 */
export default function CountryCodePicker({
  value = '+1',
  onChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected country
  const selectedCountry =
    COUNTRY_CALLING_CODES.find((c) => c.code === value) ||
    COUNTRY_CALLING_CODES[0];

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

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

  // Filter countries based on name, code, or iso
  const cleanQuery = searchQuery.trim().toLowerCase().replace(/^\+/, '');
  const filteredCountries = COUNTRY_CALLING_CODES.filter((c) => {
    if (!cleanQuery) return true;
    const nameMatch = c.name.toLowerCase().includes(cleanQuery);
    const codeMatch = c.code.replace('+', '').includes(cleanQuery);
    const isoMatch = c.iso.toLowerCase().includes(cleanQuery);
    return nameMatch || codeMatch || isoMatch;
  });

  const handleSelect = (country) => {
    if (onChange) {
      onChange(country.code);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="country-picker-container" ref={wrapperRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`country-picker-trigger ${isOpen ? 'active' : ''} ${className}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Select Country Calling Code"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="country-picker-flag">{selectedCountry?.flag || '🌐'}</span>
        <span className="country-picker-code">{value || '+1'}</span>
        <ChevronDown
          size={14}
          className={`country-picker-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="country-picker-dropdown animate-scale-in">
          {/* Sticky Search Input Bar */}
          <div className="country-picker-search-bar">
            <Search size={14} className="country-picker-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="country-picker-search-input"
              placeholder="Search country or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="country-picker-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Scrollable Country List */}
          <ul className="country-picker-list" role="listbox">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((item, idx) => {
                const isSelected = item.code === value;
                return (
                  <li
                    key={`${item.iso}-${item.code}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`country-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <span className="country-item-flag">{item.flag}</span>
                    <span className="country-item-name">{item.name}</span>
                    <span className="country-item-code">{item.code}</span>
                    {isSelected && (
                      <Check size={14} className="country-item-check" />
                    )}
                  </li>
                );
              })
            ) : (
              <div className="country-picker-no-results">
                No country found matching "{searchQuery}"
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
