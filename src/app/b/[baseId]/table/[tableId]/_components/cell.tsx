"use client";

import { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type Column = RouterOutputs["table"]["getOne"]["columns"][number];
type CellData = {
  id: string;
  columnId: string;
  valueText: string | null;
  valueNumber: number | null;
};

export const Cell = memo(function Cell({
  cell,
  column,
  rowId,
  isFocused,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  cell: CellData | undefined;
  column: Column;
  rowId: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const displayValue = useMemo(
    () =>
      column.type === "NUMBER"
        ? cell?.valueNumber != null
          ? String(cell.valueNumber)
          : ""
        : cell?.valueText ?? "",
    [cell?.valueText, cell?.valueNumber, column.type]
  );

  useEffect(() => {
    setLocalValue(displayValue);
  }, [displayValue]);

  useEffect(() => {
    if (editing && isFocused) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, isFocused]);

  useEffect(() => {
    if (isFocused && !editing) {
      wrapperRef.current?.focus();
    }
  }, [isFocused, editing]);

  const updateCell = api.row.updateCell.useMutation({
    onSuccess: () => {
      // Refresh rows so the new value is reflected in the grid
      void utils.row.getInfinite.invalidate();
    },
  });

  const handleSave = useCallback(() => {
    setEditing(false);
    if (column.type === "NUMBER") {
      const n = parseFloat(localValue);
      if (!Number.isNaN(n) && (cell?.valueNumber !== n || cell == null)) {
        updateCell.mutate({
          rowId,
          columnId: column.id,
          valueNumber: n,
          valueText: null,
        });
      }
    } else {
      if (cell?.valueText !== localValue) {
        updateCell.mutate({
          rowId,
          columnId: column.id,
          valueText: localValue,
        });
      }
    }
  }, [localValue, column.type, column.id, rowId, cell, updateCell]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "F2") {
        setEditing(true);
        e.preventDefault();
      } else if (e.key === "Tab") {
        handleSave();
        onKeyDown(e);
      } else {
        onKeyDown(e);
      }
    },
    [handleSave, onKeyDown]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
        e.preventDefault();
      } else if (e.key === "Escape") {
        setLocalValue(displayValue);
        setEditing(false);
        inputRef.current?.blur();
        e.preventDefault();
      } else if (e.key === "Tab") {
        handleSave();
        onKeyDown(e);
      }
    },
    [handleSave, displayValue, onKeyDown]
  );

  return (
    <div
      ref={wrapperRef}
      className="flex min-h-[36px] items-center border-r border-[#e8e8e8] bg-white last:border-r-0"
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setEditing(true)}
      style={{ outline: isFocused && !editing ? "2px solid #2d7ff9" : "none", outlineOffset: "-2px" }}
    >
      {editing ? (
        <input
          ref={inputRef}
          type={column.type === "NUMBER" ? "number" : "text"}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleInputKeyDown}
          className="h-full w-full border-0 bg-white px-2.5 py-1.5 text-sm text-[#37352f] outline-none"
          style={{ fontFamily: "inherit" }}
        />
      ) : (
        <span className="truncate px-2.5 py-1.5 text-sm text-[#37352f] leading-[1.4]">
          {displayValue || "\u00A0"}
        </span>
      )}
    </div>
  );
});
