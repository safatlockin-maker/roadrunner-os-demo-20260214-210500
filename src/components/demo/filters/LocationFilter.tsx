import type { DemoLocationFilter } from '../../../types/demoSections';

const options: Array<{ value: DemoLocationFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'wayne', label: 'Wayne' },
  { value: 'taylor', label: 'Taylor' },
];

interface LocationFilterProps {
  value: DemoLocationFilter;
  onChange: (value: DemoLocationFilter) => void;
  counts?: Record<DemoLocationFilter, number>;
}

export default function LocationFilter({ value, onChange, counts }: LocationFilterProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
      {options.map((option) => {
        const active = option.value === value;
        const count = counts?.[option.value];

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option.label}
            {typeof count === 'number' ? (
              <span className={`ml-2 text-xs ${active ? 'text-red-100' : 'text-gray-500'}`}>{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
