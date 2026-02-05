"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function TablesList({
  baseId,
  baseName,
}: {
  baseId: string;
  baseName: string;
}) {
  const [name, setName] = useState("");
  const router = useRouter();
  const utils = api.useUtils();
  const { data: tables, isLoading } = api.table.list.useQuery({ baseId });
  const createTable = api.table.create.useMutation({
    onSuccess: (table) => {
      void utils.table.list.invalidate();
      setName("");
      router.push(`/b/${baseId}/table/${table.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2d7ff9] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Link href="/b" className="hover:text-[#2d7ff9]">
          Bases
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800">{baseName}</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{baseName}</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New table name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              createTable.mutateAsync({ baseId, name: name || "Untitled table" }).catch(() => {})
            }
          />
          <button
            type="button"
            onClick={() => createTable.mutate({ baseId, name: name || "Untitled table" })}
            disabled={createTable.isPending}
            className="rounded bg-[#2d7ff9] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a6de8] disabled:opacity-50"
          >
            {createTable.isPending ? "Creating…" : "New table"}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tables?.map((table) => (
          <Link
            key={table.id}
            href={`/b/${baseId}/table/${table.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#2d7ff9] hover:shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#e8f4fc] text-[#2d7ff9]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h18M3 6h18" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{table.name}</p>
              <p className="text-xs text-gray-500">{table.columns.length} column(s)</p>
            </div>
          </Link>
        ))}
      </div>
      {tables?.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No tables yet. Create one to get started (includes sample rows).
        </p>
      )}
    </div>
  );
}
