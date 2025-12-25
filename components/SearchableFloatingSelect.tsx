"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export type SearchableFloatingSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
};

export default function SearchableFloatingSelect({
  id,
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  placeholder = "Search...",
  searchPlaceholder = "Type to search...",
}: SearchableFloatingSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const showError = required && touched && !value;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTouched(true);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    setSearch("");
    setTouched(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Select Button */}
      <div className="relative">
        <div
          onClick={() => !disabled && setOpen(!open)}
          className={`
            peer w-full h-12 px-3 rounded-md border bg-white text-[16px] text-gray-800 
            focus:border-2 focus:border-blue-400 focus:outline-none transition cursor-pointer
            flex items-center justify-between
            ${disabled ? "!bg-gray-200 !text-gray-500 cursor-not-allowed" : ""}
            ${showError ? "border-red-500 bg-red-50" : open ? "border-2 border-blue-400" : "border-gray-300"}
            ${!disabled && "hover:border-gray-400"}
          `}
        >
          {/* Selected Value with padding for label */}
          <span className={`${value ? "text-gray-800 pt-4" : "text-transparent"} truncate pr-2`}>
            {selectedOption?.label || "placeholder"}
          </span>
          <ChevronDown 
            className={`size-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} 
          />
        </div>

        {/* Floating Label - positioned absolutely relative to parent */}
        <label
          htmlFor={id}
          className={`absolute left-3 transition-all pointer-events-none
            ${value ? "top-1 text-xs text-gray-500" : "top-1/2 -translate-y-1/2 text-[15px] text-gray-500"}
          `}
        >
          {label} {required && <span className="text-red-500 ml-[1px]">*</span>}
        </label>
      </div>

      {/* Error Message */}
      {showError && (
        <p className="text-xs text-red-500 mt-1">Please select an option</p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="size-3 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    px-4 py-2.5 cursor-pointer transition-colors text-sm
                    ${opt.value === value 
                      ? "bg-blue-50 text-blue-600 font-medium" 
                      : "hover:bg-gray-100 text-gray-800"
                    }
                  `}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}