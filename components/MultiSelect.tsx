import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './icons';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedIds, onChange, placeholder = 'انتخاب کنید...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);
  
  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
    }
  }, [isOpen]);

  const toggleOption = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    onChange(newSelectedIds);
  };
  
  const filteredOptions = options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 flex flex-wrap gap-2 items-center cursor-pointer min-h-[42px]"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(option => (
            <span key={option.id} className="flex items-center bg-teal-600 text-white text-sm font-medium px-2 py-1 rounded">
              {option.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(option.id);
                }}
                className="mr-2 text-teal-200 hover:text-white text-lg leading-none"
              >
                &times;
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 px-1">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 absolute left-3 top-1/2 -translate-y-1/2 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
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
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className="flex items-center px-3 py-2 text-sm text-white hover:bg-gray-700/80 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-teal-600 ml-3 cursor-pointer"
                  />
                  <span className="flex-grow">{option.name}</span>
                </li>
              ))
            ) : (
                <li className="px-3 py-2 text-sm text-center text-gray-400">موردی یافت نشد.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;