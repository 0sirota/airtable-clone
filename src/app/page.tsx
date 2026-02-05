import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/b");
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f7]">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">Airtable Clone</h1>
        <p className="text-gray-600">Sign in with Google to get started.</p>
        <a
          href="/api/auth/signin"
          className="rounded-md bg-[#2d7ff9] px-6 py-2.5 font-medium text-white no-underline transition hover:bg-[#1a6de8]"
        >
          Sign in with Google
        </a>
      </div>
    </main>
  );
}
