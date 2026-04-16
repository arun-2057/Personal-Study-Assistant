import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/nlp/quiz-generator";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, numQuestions = 10 } = body;

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const note = await db.note.findFirst({ where: { id: noteId, userId } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const questions = generateQuiz(note.content, { numQuestions });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate quiz. The note may be too short or lack clear topics." },
        { status: 400 }
      );
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const quiz = await db.quiz.create({
      data: {
        userId,
        noteId,
        title: `Quiz: ${note.title}`,
        questions: JSON.stringify(questions),
        totalPoints,
      },
    });

    return NextResponse.json({
      ...quiz,
      questions: JSON.parse(quiz.questions),
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizzes = await db.quiz.findMany({
      where: { userId },
      include: {
        note: { select: { title: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        noteTitle: q.note.title,
        totalPoints: q.totalPoints,
        questionCount: JSON.parse(q.questions).length,
        resultCount: q.results.length,
        createdAt: q.createdAt,
      }))
    );
  } catch (error) {
    console.error("Quizzes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}
