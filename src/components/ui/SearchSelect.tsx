"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  sub?: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchSelect({ options, value, onChange, placeholder = "Buscar...", required }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sub || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleOpen() {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={ref} className="relative">
      {/* Display button */}
      <button type="button" onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left outline-none focus:ring-2 focus:ring-blue-500">
        <span className={selected ? "text-gray-900 font-medium truncate" : "text-gray-600 truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
              className="text-gray-400 hover:text-red-500 p-0.5">
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </button>

      {/* Hidden input for form required validation */}
      {required && <input type="text" value={value} required tabIndex={-1}
        className="absolute opacity-0 h-0 w-0" onChange={() => {}} />}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b flex items-center gap-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full outline-none text-sm text-gray-900 placeholder-gray-400" />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">Nenhum resultado encontrado</div>
            )}
            {filtered.map(o => (
              <button key={o.value} type="button" onClick={() => handleSelect(o.value)}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex flex-col border-b border-gray-50
                  ${o.value === value ? "bg-blue-50" : ""}`}>
                <span className="text-sm font-medium text-gray-900">{o.label}</span>
                {o.sub && <span className="text-xs text-gray-500">{o.sub}</span>}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="px-3 py-1.5 border-t bg-gray-50 text-xs text-gray-500">
            {filtered.length} de {options.length} resultados
          </div>
        </div>
      )}
    </div>
  );
}
