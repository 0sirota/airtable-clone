import { notFound } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";
import { TableGrid } from "./_components/table-grid";

export default async function TablePage({
  params,
}: {
  params: Promise<{ baseId: string; tableId: string }>;
}) {
  const { baseId, tableId } = await params;
  const table = await api.table.getOne({ id: tableId }).catch(() => null);
  if (!table) notFound();

  return (
    <HydrateClient>
      <TableGrid baseId={baseId} table={table} />
    </HydrateClient>
  );
}
