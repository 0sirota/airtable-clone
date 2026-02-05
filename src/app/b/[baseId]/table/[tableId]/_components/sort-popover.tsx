"use client";

import { useState, useRef, useEffect } from "react";
import type { RouterOutputs } from "~/trpc/react";
import type { SortConfigItem } from "~/server/api/types";

type Column = RouterOutputs["table"]["getOne"]["columns"][number];

export function SortPopover({
  columns,
  sortConfig,
  onSortChange,
}: {
  columns: Column[];
  sortConfig: SortConfigItem[];
  onSortChange: (v: SortConfigItem[]) => void;
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

  const addSort = (col: Column) => {
    onSortChange([...sortConfig, { columnId: col.id, direction: "asc" }]);
  };

  const removeSort = (index: number) => {
    onSortChange(sortConfig.filter((_, i) => i !== index));
  };

  const toggleDirection = (index: number) => {
    const next = [...sortConfig];
    const cur = next[index];
    if (cur)
      next[index] = {
        ...cur,
        direction: cur.direction === "asc" ? "desc" : "asc",
      };
    onSortChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50"
      >
        Sort
        {sortConfig.length > 0 && (
          <span className="rounded bg-[#2d7ff9] px-1 text-xs text-white">
            {sortConfig.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded border border-gray-200 bg-white py-2 shadow-lg">
          <div className="max-h-48 overflow-auto px-2">
            {sortConfig.map((s, i) => {
              const col = columns.find((c) => c.id === s.columnId);
              if (!col) return null;
              return (
                <div
                  key={i}
                  className="mb-1 flex items-center justify-between rounded border border-gray-100 px-2 py-1"
                >
                  <span className="text-xs font-medium text-gray-700">{col.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleDirection(i)}
                      className="text-xs text-[#2d7ff9] hover:underline"
                    >
                      {col.type === "NUMBER"
                        ? s.direction === "asc"
                          ? "Increasing"
                          : "Decreasing"
                        : s.direction === "asc"
                          ? "A→Z"
                          : "Z→A"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSort(i)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-2 pt-2">
            <p className="mb-1 text-xs text-gray-500">Add sort</p>
            <div className="flex flex-wrap gap-1">
              {columns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => addSort(col)}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
