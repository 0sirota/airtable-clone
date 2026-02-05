import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function BasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
        <a href="/b" className="text-lg font-semibold text-gray-800">
          Airtable Clone
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{session.user.name ?? session.user.email}</span>
          <a
            href="/api/auth/signout"
            className="text-sm text-[#2d7ff9] hover:underline"
          >
            Sign out
          </a>
        </div>
      </header>
      {children}
    </div>
  );
}
