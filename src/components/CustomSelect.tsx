import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function CustomSelect({ value, onChange, options, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] px-3 text-sm font-medium text-[var(--text-main)] shadow-sm transition-colors hover:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <span className="truncate">{selectedOption?.label || 'Selecione...'}</span>
        <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-y-auto custom-scrollbar rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-500/10 font-bold text-[var(--nexus-primary)]'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={16} className="shrink-0 text-[var(--nexus-primary)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
