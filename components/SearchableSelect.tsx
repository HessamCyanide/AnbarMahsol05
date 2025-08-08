import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './icons';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'انتخاب کنید...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
    }
  }, [isOpen])

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionId: string | null) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-right focus:ring-2 focus:ring-teal-500 focus:border-teal-500 flex justify-between items-center"
      >
        <span className="truncate">{selectedOption ? selectedOption.name : <span className="text-gray-400">{placeholder}</span>}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-2 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border-gray-500 rounded-md py-1.5 pl-3 pr-8 text-white text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                </div>
            </div>
          </div>
          <ul className="overflow-y-auto flex-grow">
            <li
                onClick={() => handleSelect(null)}
                className="px-3 py-2 text-sm text-gray-300 hover:bg-teal-600 hover:text-white cursor-pointer"
            >
              {placeholder === 'بدون تگ' ? 'بدون تگ' : 'بدون دسته‌بندی'}
            </li>
            {filteredOptions.map(option => (
              <li
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`px-3 py-2 text-sm text-white hover:bg-teal-600 cursor-pointer truncate ${value === option.id ? 'bg-teal-700' : ''}`}
              >
                {option.name}
              </li>
            ))}
            {filteredOptions.length === 0 && <li className="px-3 py-2 text-sm text-center text-gray-400">موردی یافت نشد.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;