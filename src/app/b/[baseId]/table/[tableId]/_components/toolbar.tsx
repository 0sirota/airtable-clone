"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import type { FilterConfigItem, SortConfigItem } from "~/server/api/types";
import { FilterPopover } from "./filter-popover";
import { SortPopover } from "./sort-popover";
import { ColumnVisibilityPopover } from "./column-visibility-popover";

type Column = RouterOutputs["table"]["getOne"]["columns"][number];

export function Toolbar({
  tableId,
  columns,
  search,
  onSearchChange,
  sortConfig,
  onSortChange,
  filterConfig,
  onFilterChange,
  columnVisibility,
  onColumnVisibilityChange,
}: {
  tableId: string;
  columns: Column[];
  search: string;
  onSearchChange: (v: string) => void;
  sortConfig: SortConfigItem[];
  onSortChange: (v: SortConfigItem[]) => void;
  filterConfig: FilterConfigItem[];
  onFilterChange: (v: FilterConfigItem[]) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (v: Record<string, boolean>) => void;
}) {
  const [addColumnName, setAddColumnName] = useState("");
  const [addColumnType, setAddColumnType] = useState<"TEXT" | "NUMBER">("TEXT");
  const utils = api.useUtils();
  const addColumn = api.column.create.useMutation({
    onSuccess: (newColumn) => {
      // Optimistically update the table query instead of invalidating
      utils.table.getOne.setData({ id: tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          columns: [...old.columns, newColumn].sort((a, b) => a.order - b.order),
        };
      });
      setAddColumnName("");
    },
  });
  const add100k = api.row.createMany.useMutation({
    onSuccess: () => {
      // Only invalidate row queries, not table structure
      void utils.row.getInfinite.invalidate();
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e8e8e8] bg-white px-3 py-2">
      <input
        type="text"
        placeholder="Search all cells..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="rounded border border-[#e8e8e8] px-2.5 py-1.5 text-sm w-48 text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:ring-2 focus:ring-[#2d7ff9] focus:border-transparent"
      />
      <FilterPopover
        columns={columns}
        filterConfig={filterConfig}
        onFilterChange={onFilterChange}
      />
      <SortPopover
        columns={columns}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
      />
      <ColumnVisibilityPopover
        columns={columns}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
      <div className="ml-2 flex items-center gap-1.5 border-l border-[#e8e8e8] pl-2">
        <input
          type="text"
          placeholder="Column name"
          value={addColumnName}
          onChange={(e) => setAddColumnName(e.target.value)}
          className="rounded border border-[#e8e8e8] px-2.5 py-1.5 text-sm w-28 text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:ring-2 focus:ring-[#2d7ff9] focus:border-transparent"
        />
        <select
          value={addColumnType}
          onChange={(e) => setAddColumnType(e.target.value as "TEXT" | "NUMBER")}
          className="rounded border border-[#e8e8e8] px-2.5 py-1.5 text-sm text-[#37352f] focus:outline-none focus:ring-2 focus:ring-[#2d7ff9] focus:border-transparent"
        >
          <option value="TEXT">Text</option>
          <option value="NUMBER">Number</option>
        </select>
        <button
          type="button"
          onClick={() =>
            addColumn.mutate({
              tableId,
              name: addColumnName || "New column",
              type: addColumnType,
            })
          }
          disabled={addColumn.isPending}
          className="rounded bg-[#f7f6f3] px-2.5 py-1.5 text-sm font-medium text-[#37352f] hover:bg-[#edece9] disabled:opacity-50 transition-colors"
        >
          {addColumn.isPending ? "Adding…" : "Add column"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => add100k.mutate({ tableId, count: 100_000 })}
        disabled={add100k.isPending}
        className="rounded bg-[#2d7ff9] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1a6de8] disabled:opacity-50 transition-colors"
      >
        {add100k.isPending ? "Adding…" : "Add 100k rows"}
      </button>
    </div>
  );
}
