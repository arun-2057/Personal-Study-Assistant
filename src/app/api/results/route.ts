import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db.quizResult.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            note: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      results.map((r) => ({
        id: r.id,
        quizTitle: r.quiz.title,
        noteTitle: r.quiz.note.title,
        score: r.score,
        total: r.total,
        percentage: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
        date: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
