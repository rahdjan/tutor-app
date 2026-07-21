import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { DashboardHeader } from "@/components/dashboard-header";
import { NewWorksheetForm } from "./new-form";

export const metadata: Metadata = { title: "Новый рабочий лист" };

export default async function NewWorksheetPage() {
  const session = await requireTutor();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} subject={session.user.subject} tutorNav />
      <Link href="/tutor/worksheets" className="text-sm font-semibold underline">
        ← К списку листов
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Новый рабочий лист
      </h1>
      <div className="window-card max-w-xl p-6">
        <NewWorksheetForm />
      </div>
    </div>
  );
}
