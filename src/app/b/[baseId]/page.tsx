import { notFound } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";
import { TablesList } from "./_components/tables-list";

export default async function BasePage({
  params,
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params;
  const base = await api.base.getOne({ id: baseId }).catch(() => null);
  if (!base) notFound();

  return (
    <HydrateClient>
      <main className="p-6">
        <TablesList baseId={baseId} baseName={base.name} />
      </main>
    </HydrateClient>
  );
}
