// Отдача фото решения из приватного хранилища.
// Право доступа: репетитор, которому принадлежит работа, или сам ученик.
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readSolutionPhoto } from "@/lib/blob";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const { entryId } = await params;

  // Изоляция: запись должна принадлежать либо репетитору работы, либо ученику.
  const entry = await prisma.answerEntry.findFirst({
    where: {
      id: entryId,
      submission: {
        assignment: {
          OR: [
            { tutorId: session.user.id },
            { student: { userId: session.user.id } },
          ],
        },
      },
    },
    select: { fileUrl: true },
  });
  if (!entry?.fileUrl) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const result = await readSolutionPhoto(entry.fileUrl);
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Файл недоступен" }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
