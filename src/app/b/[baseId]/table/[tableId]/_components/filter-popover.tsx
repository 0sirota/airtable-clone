"use client";

import { useState, useRef, useEffect } from "react";
import type { RouterOutputs } from "~/trpc/react";
import type { FilterConfigItem } from "~/server/api/types";

type Column = RouterOutputs["table"]["getOne"]["columns"][number];

const TEXT_OPERATORS = [
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "equal_to", label: "is equal to" },
] as const;

const NUMBER_OPERATORS = [
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "equal_to", label: "=" },
] as const;

export function FilterPopover({
  columns,
  filterConfig,
  onFilterChange,
}: {
  columns: Column[];
  filterConfig: FilterConfigItem[];
  onFilterChange: (v: FilterConfigItem[]) => void;
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

  const addFilter = (col: Column) => {
    if (col.type === "NUMBER") {
      onFilterChange([
        ...filterConfig,
        { columnId: col.id, columnType: "NUMBER", operator: "greater_than", value: 0 },
      ]);
    } else {
      onFilterChange([
        ...filterConfig,
        { columnId: col.id, columnType: "TEXT", operator: "is_not_empty" },
      ]);
    }
  };

  const removeFilter = (index: number) => {
    onFilterChange(filterConfig.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, update: Partial<FilterConfigItem>) => {
    const next = [...filterConfig];
    const cur = next[index];
    if (cur) next[index] = { ...cur, ...update } as FilterConfigItem;
    onFilterChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50"
      >
        Filter
        {filterConfig.length > 0 && (
          <span className="rounded bg-[#2d7ff9] px-1 text-xs text-white">
            {filterConfig.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded border border-gray-200 bg-white py-2 shadow-lg">
          <div className="max-h-64 overflow-auto px-2">
            {filterConfig.map((f, i) => {
              const col = columns.find((c) => c.id === f.columnId);
              if (!col) return null;
              return (
                <div key={i} className="mb-2 flex flex-wrap items-center gap-1 rounded border border-gray-100 p-2">
                  <span className="text-xs font-medium text-gray-700">{col.name}</span>
                  <select
                    value={f.operator}
                    onChange={(e) =>
                      updateFilter(i, { operator: e.target.value as FilterConfigItem["operator"] })
                    }
                    className="rounded border border-gray-300 px-1 text-xs"
                  >
                    {(col.type === "NUMBER" ? NUMBER_OPERATORS : TEXT_OPERATORS).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {(f.operator === "contains" ||
                    f.operator === "not_contains" ||
                    f.operator === "equal_to" ||
                    (col.type === "NUMBER" && f.operator !== "is_empty" && f.operator !== "is_not_empty")) && (
                    col.type === "NUMBER" ? (
                      <input
                        type="number"
                        value={typeof f.value === "number" ? f.value : ""}
                        onChange={(e) =>
                          updateFilter(i, { value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 rounded border border-gray-300 px-1 text-xs"
                      />
                    ) : (
                      <input
                        type="text"
                        value={typeof f.value === "string" ? f.value : ""}
                        onChange={(e) => updateFilter(i, { value: e.target.value })}
                        className="w-24 rounded border border-gray-300 px-1 text-xs"
                      />
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => removeFilter(i)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 px-2 pt-2">
            <p className="mb-1 text-xs text-gray-500">Add filter</p>
            <div className="flex flex-wrap gap-1">
              {columns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => addFilter(col)}
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
