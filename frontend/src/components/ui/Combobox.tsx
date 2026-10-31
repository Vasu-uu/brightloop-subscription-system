import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

export type ComboOption = { id: number; label: string; hint?: string };

export function Combobox({
  label,
  value,
  selectedLabel,
  placeholder = "Search...",
  fetchOptions,
  onChange,
  error,
  disabled,
}: {
  label?: string;
  value: number | "";
  selectedLabel?: string;
  placeholder?: string;
  fetchOptions: (search: string) => Promise<ComboOption[]>;
  onChange: (option: ComboOption) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ComboOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<ComboOption | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = setTimeout(() => {
      fetchOptions(search)
        .then(setOptions)
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const shown = picked?.id === value ? picked.label : selectedLabel;

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors dark:bg-gray-800 ${
            error ? "border-red-400" : "border-gray-300 hover:border-gray-400 dark:border-gray-700"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <span className={shown ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>{shown || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full animate-scale-in overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {loading && <li className="px-3 py-2 text-sm text-gray-400">Loading...</li>}
              {!loading && options.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">No results</li>}
              {!loading &&
                options.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked(o);
                        onChange(o);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span>
                        <span className="text-gray-900 dark:text-gray-100">{o.label}</span>
                        {o.hint && <span className="ml-2 text-xs text-gray-400">{o.hint}</span>}
                      </span>
                      {o.id === value && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
