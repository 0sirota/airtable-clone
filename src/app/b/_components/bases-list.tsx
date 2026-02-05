"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export function BasesList() {
  const [name, setName] = useState("");
  const utils = api.useUtils();
  const { data: bases, isLoading } = api.base.list.useQuery();
  const createBase = api.base.create.useMutation({
    onSuccess: () => {
      void utils.base.list.invalidate();
      setName("");
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Your bases</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New base name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            onKeyDown={(e) => e.key === "Enter" && createBase.mutateAsync({ name }).catch(() => {})}
          />
          <button
            type="button"
            onClick={() => createBase.mutate({ name: name || "Untitled base" })}
            disabled={createBase.isPending}
            className="rounded bg-[#2d7ff9] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1a6de8] disabled:opacity-50"
          >
            {createBase.isPending ? "Creating…" : "New base"}
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {bases?.map((base) => (
          <Link
            key={base.id}
            href={`/b/${base.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#2d7ff9] hover:shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{base.name}</p>
              <p className="text-xs text-gray-500">{base.tables.length} table(s)</p>
            </div>
          </Link>
        ))}
      </div>
      {bases?.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No bases yet. Create one above.
        </p>
      )}
    </div>
  );
}
