import type { ReactNode } from 'react';

export interface QuickChipOption<TKey extends string> {
  key: TKey;
  label: string;
  helper?: string;
  icon?: ReactNode;
}

interface QuickChipsProps<TKey extends string> {
  title?: string;
  options: QuickChipOption<TKey>[];
  active: TKey[];
  onToggle: (key: TKey) => void;
}

export default function QuickChips<TKey extends string>({ title, options, active, onToggle }: QuickChipsProps<TKey>) {
  return (
    <div>
      {title ? <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const enabled = active.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                enabled
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.helper ? <span className="font-normal opacity-80">{option.helper}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
