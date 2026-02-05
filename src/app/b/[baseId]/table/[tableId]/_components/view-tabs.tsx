"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { FilterConfigItem, SortConfigItem } from "~/server/api/types";

export function ViewTabs({
  tableId,
  currentSort,
  currentFilter,
  currentSearch,
  currentVisibility,
  onLoadView,
}: {
  tableId: string;
  currentSort: SortConfigItem[];
  currentFilter: FilterConfigItem[];
  currentSearch: string;
  currentVisibility: Record<string, boolean>;
  onLoadView: (view: {
    sortConfig: unknown;
    filterConfig: unknown;
    searchQuery: string | null;
    columnVisibility: unknown;
  }) => void;
}) {
  const [newViewName, setNewViewName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const utils = api.useUtils();
  const { data: views } = api.view.list.useQuery({ tableId });
  const createView = api.view.create.useMutation({
    onSuccess: () => {
      void utils.view.list.invalidate({ tableId });
      setNewViewName("");
      setShowSave(false);
    },
  });

  return (
    <div className="flex items-center gap-0.5 border-b border-[#e8e8e8] bg-[#fafafa] px-2">
      {views?.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() =>
            onLoadView({
              sortConfig: view.sortConfig,
              filterConfig: view.filterConfig,
              searchQuery: view.searchQuery,
              columnVisibility: view.columnVisibility,
            })
          }
          className="rounded px-3 py-1.5 text-xs font-medium text-[#37352f] hover:bg-white transition-colors"
        >
          {view.name}
        </button>
      ))}
      {showSave ? (
        <div className="flex items-center gap-1.5 px-2">
          <input
            type="text"
            placeholder="View name"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            className="rounded border border-[#e8e8e8] px-2.5 py-1 text-xs w-32 text-[#37352f] placeholder:text-[#9b9a97] focus:outline-none focus:ring-2 focus:ring-[#2d7ff9] focus:border-transparent"
            autoFocus
          />
          <button
            type="button"
            onClick={() =>
              createView.mutate({
                tableId,
                name: newViewName || "Untitled view",
                sortConfig: currentSort,
                filterConfig: currentFilter,
                columnVisibility: currentVisibility,
                searchQuery: currentSearch || undefined,
              })
            }
            disabled={createView.isPending}
            className="rounded bg-[#2d7ff9] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1a6de8] disabled:opacity-50 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowSave(false)}
            className="rounded px-2.5 py-1 text-xs text-[#6b6b6b] hover:bg-white transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="rounded px-3 py-1.5 text-xs font-medium text-[#2d7ff9] hover:bg-white transition-colors"
        >
          + Save view
        </button>
      )}
    </div>
  );
}
