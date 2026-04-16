import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await db.quiz.findFirst({
      where: { id, userId },
      include: {
        note: { select: { title: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const results = await db.quizResult.findMany({
      where: { quizId: id, userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...quiz,
      questions: JSON.parse(quiz.questions),
      hasAttempted: results.length > 0,
      bestScore: results.length > 0
        ? Math.max(...results.map((r) => r.score))
        : null,
      attempts: results.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Answers array is required" },
        { status: 400 }
      );
    }

    const quiz = await db.quiz.findFirst({
      where: { id, userId },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = JSON.parse(quiz.questions);
    let earnedPoints = 0;
    let totalPoints = 0;

    const detailedResults = questions.map((q: any, i: number) => {
      totalPoints += q.points || 1;
      const userAnswer = answers[i];
      const isCorrect =
        userAnswer?.toString().toLowerCase().trim() ===
        q.correctAnswer?.toString().toLowerCase().trim();

      if (isCorrect) {
        earnedPoints += q.points || 1;
      }

      return {
        questionId: q.id,
        type: q.type,
        question: q.question,
        userAnswer: userAnswer || "No answer",
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        points: q.points || 1,
      };
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    const result = await db.quizResult.create({
      data: {
        userId,
        quizId: id,
        score: earnedPoints,
        total: totalPoints,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({
      resultId: result.id,
      earnedPoints,
      totalPoints,
      percentage,
      detailedResults,
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
