import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/access";
import { createStudent } from "@/app/actions/students";
import { DashboardHeader } from "@/components/dashboard-header";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Новый ученик" };

export default async function NewStudentPage() {
  const session = await requireTutor();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <DashboardHeader userName={session.user.name} />

      <Link href="/tutor" className="text-sm font-semibold underline">
        ← К списку учеников
      </Link>
      <h1 className="mt-4 mb-6 text-3xl font-extrabold tracking-tight">
        Новый ученик
      </h1>

      <div className="window-card max-w-xl p-6">
        <StudentForm action={createStudent} submitLabel="Добавить ученика" />
      </div>
    </div>
  );
}
