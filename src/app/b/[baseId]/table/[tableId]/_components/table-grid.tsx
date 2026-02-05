"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import type { FilterConfigItem, SortConfigItem } from "~/server/api/types";
import { Toolbar } from "./toolbar";
import { ViewTabs } from "./view-tabs";
import { Cell } from "./cell";

type Table = RouterOutputs["table"]["getOne"];

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const PAGE_SIZE = 50;

export function TableGrid({
  baseId,
  table: initialTable,
}: {
  baseId: string;
  table: Table;
}) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([]);
  const [filterConfig, setFilterConfig] = useState<FilterConfigItem[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const { data: table } = api.table.getOne.useQuery(
    { id: initialTable.id },
    { initialData: initialTable }
  );

  const visibleColumns = useMemo(
    () => table.columns.filter((c) => columnVisibility[c.id] !== false),
    [table.columns, columnVisibility]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = api.row.getInfinite.useInfiniteQuery(
    {
      tableId: table.id,
      limit: PAGE_SIZE,
      search: search || undefined,
      sortConfig: sortConfig.length ? sortConfig : undefined,
      filterConfig: filterConfig.length ? filterConfig : undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }
  );

  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const totalCount = allRows.length + (hasNextPage ? 1 : 0) + 1; // +1 for header row (index 0)
  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => gridRef.current,
    estimateSize: (i) => (i === 0 ? HEADER_HEIGHT : ROW_HEIGHT),
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastVirtual = virtualItems[virtualItems.length - 1];
  const shouldFetchMore =
    lastVirtual &&
    lastVirtual.index >= allRows.length &&
    lastVirtual.index > 0 &&
    hasNextPage &&
    !isFetchingNextPage;
  if (shouldFetchMore) {
    void fetchNextPage();
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e8e8e8] bg-white px-4 py-2.5 text-sm">
        <Link href={`/b/${baseId}`} className="text-[#6b6b6b] hover:text-[#2d7ff9] transition-colors">
          {table.base.name}
        </Link>
        <span className="text-[#c4c4c4]">/</span>
        <span className="font-medium text-[#37352f]">{table.name}</span>
      </div>

      <ViewTabs
        tableId={table.id}
        currentSort={sortConfig}
        currentFilter={filterConfig}
        currentSearch={search}
        currentVisibility={columnVisibility}
        onLoadView={(v) => {
          setSortConfig((v.sortConfig as SortConfigItem[]) ?? []);
          setFilterConfig((v.filterConfig as FilterConfigItem[]) ?? []);
          setSearch(v.searchQuery ?? "");
          setColumnVisibility((v.columnVisibility as Record<string, boolean>) ?? {});
        }}
      />

      <Toolbar
        tableId={table.id}
        columns={table.columns}
        search={search}
        onSearchChange={setSearch}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        filterConfig={filterConfig}
        onFilterChange={setFilterConfig}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      <div className="relative flex-1 overflow-auto" ref={gridRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2d7ff9] border-t-transparent" />
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              minWidth: Math.max(800, visibleColumns.length * 180),
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              if (virtualRow.index === 0) {
                return (
                  <div
                    key={virtualRow.key}
                    className="grid border-b border-[#e8e8e8] bg-[#fafafa] sticky top-0 z-10"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: HEADER_HEIGHT,
                      transform: `translateY(${virtualRow.start}px)`,
                      gridTemplateColumns: `52px repeat(${visibleColumns.length}, minmax(180px, 1fr))`,
                    }}
                  >
                    <div className="flex items-center border-r border-[#e8e8e8] bg-[#fafafa] px-2.5 text-xs font-medium text-[#6b6b6b]">
                      #
                    </div>
                    {visibleColumns.map((col) => (
                      <div
                        key={col.id}
                        className="flex items-center border-r border-[#e8e8e8] bg-[#fafafa] px-2.5 font-medium text-[#37352f] text-xs last:border-r-0"
                      >
                        {col.name}
                      </div>
                    ))}
                  </div>
                );
              }
              if (virtualRow.index > allRows.length) {
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: ROW_HEIGHT,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex items-center justify-center border-b border-gray-100"
                  >
                    {isFetchingNextPage ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2d7ff9] border-t-transparent" />
                    ) : null}
                  </div>
                );
              }
              const row = allRows[virtualRow.index - 1]!;
              const cellMap = new Map(row.cells.map((c) => [c.columnId, c]));
              return (
                <div
                  key={row.id}
                  className="grid border-b border-[#e8e8e8] hover:bg-[#f7f6f3] transition-colors"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: `52px repeat(${visibleColumns.length}, minmax(180px, 1fr))`,
                  }}
                >
                  <div className="flex items-center border-r border-[#e8e8e8] bg-[#fafafa] px-2.5 text-xs text-[#6b6b6b] font-medium">
                    {virtualRow.index}
                  </div>
                  {visibleColumns.map((col, colIndex) => (
                    <Cell
                      key={col.id}
                      cell={cellMap.get(col.id)}
                      column={col}
                      rowId={row.id}
                      isFocused={
                        focusedCell?.rowIndex === virtualRow.index - 1 &&
                        focusedCell?.colIndex === colIndex
                      }
                      onFocus={() =>
                        setFocusedCell({ rowIndex: virtualRow.index - 1, colIndex })
                      }
                      onBlur={() => setFocusedCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight" && colIndex < visibleColumns.length - 1) {
                          setFocusedCell({
                            rowIndex: virtualRow.index - 1,
                            colIndex: colIndex + 1,
                          });
                          e.preventDefault();
                        } else if (e.key === "ArrowLeft" && colIndex > 0) {
                          setFocusedCell({
                            rowIndex: virtualRow.index - 1,
                            colIndex: colIndex - 1,
                          });
                          e.preventDefault();
                        } else if (e.key === "ArrowDown") {
                          setFocusedCell({
                            rowIndex: virtualRow.index,
                            colIndex,
                          });
                          e.preventDefault();
                        } else if (e.key === "ArrowUp" && virtualRow.index > 1) {
                          setFocusedCell({
                            rowIndex: virtualRow.index - 2,
                            colIndex,
                          });
                          e.preventDefault();
                        } else if (e.key === "Tab" && !e.shiftKey) {
                          // Tab: move right, wrap to next row if at end
                          if (colIndex < visibleColumns.length - 1) {
                            setFocusedCell({
                              rowIndex: virtualRow.index - 1,
                              colIndex: colIndex + 1,
                            });
                          } else if (virtualRow.index < allRows.length) {
                            // Wrap to first column of next row
                            setFocusedCell({
                              rowIndex: virtualRow.index,
                              colIndex: 0,
                            });
                          }
                          e.preventDefault();
                        } else if (e.key === "Tab" && e.shiftKey) {
                          // Shift+Tab: move left, wrap to previous row if at start
                          if (colIndex > 0) {
                            setFocusedCell({
                              rowIndex: virtualRow.index - 1,
                              colIndex: colIndex - 1,
                            });
                          } else if (virtualRow.index > 1) {
                            // Wrap to last column of previous row
                            setFocusedCell({
                              rowIndex: virtualRow.index - 2,
                              colIndex: visibleColumns.length - 1,
                            });
                          }
                          e.preventDefault();
                        }
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isFetching && !isFetchingNextPage && (
        <div className="absolute right-4 top-24 flex items-center gap-1.5 rounded-md bg-[#37352f] px-2.5 py-1.5 text-xs text-white shadow-sm">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Loading…
        </div>
      )}
    </div>
  );
}
