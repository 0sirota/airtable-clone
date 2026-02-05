import { HydrateClient } from "~/trpc/server";
import { BasesList } from "./_components/bases-list";

export default function BasesPage() {
  return (
    <HydrateClient>
      <main className="p-6">
        <BasesList />
      </main>
    </HydrateClient>
  );
}
