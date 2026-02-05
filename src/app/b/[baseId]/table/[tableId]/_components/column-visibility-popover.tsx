"use client";

import { useState, useRef, useEffect } from "react";
import type { RouterOutputs } from "~/trpc/react";

type Column = RouterOutputs["table"]["getOne"]["columns"][number];

export function ColumnVisibilityPopover({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
}: {
  columns: Column[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (v: Record<string, boolean>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, []);

  const toggle = (columnId: string) => {
    const next = { ...columnVisibility };
    next[columnId] = !(next[columnId] !== false);
    onColumnVisibilityChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50"
      >
        Fields
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded border border-gray-200 bg-white py-2 shadow-lg">
          <div className="max-h-64 overflow-auto px-2">
            <p className="mb-1 text-xs text-gray-500">Show/hide columns</p>
            {columns.map((col) => (
              <label
                key={col.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={columnVisibility[col.id] !== false}
                  onChange={() => toggle(col.id)}
                  className="rounded"
                />
                <span className="text-sm text-gray-800">{col.name}</span>
                <span className="text-xs text-gray-400">({col.type})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
