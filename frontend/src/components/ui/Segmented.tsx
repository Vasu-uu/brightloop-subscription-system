import { useLayoutEffect, useRef, useState } from "react";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = refs.current[value];
    if (el) setBox({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options]);

  return (
    <div className="relative inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
      <span
        className="absolute bottom-1 top-1 rounded-md bg-white shadow-sm transition-all duration-300 ease-out dark:bg-gray-700"
        style={{ left: box.left, width: box.width }}
      />
      {options.map((o) => (
        <button
          key={o.key}
          ref={(el) => {
            refs.current[o.key] = el;
          }}
          onClick={() => onChange(o.key)}
          className={`relative z-10 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === o.key ? "text-gray-900 dark:text-gray-50" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
