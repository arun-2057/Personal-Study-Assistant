import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { extractTopics } from "@/lib/nlp/topic-extraction";
import { generateStudyPlan } from "@/lib/nlp/study-plan-generator";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, days = 7 } = body;

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const note = await db.note.findFirst({ where: { id: noteId, userId } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const topics = JSON.parse(note.topics) as { term: string; score: number }[];
    const plan = generateStudyPlan(topics, days);

    if (plan.length === 0) {
      return NextResponse.json(
        { error: "Could not generate study plan. The note may be too short." },
        { status: 400 }
      );
    }

    const studyPlan = await db.studyPlan.create({
      data: {
        userId,
        noteId,
        plan: JSON.stringify(plan),
        days: plan.length,
      },
    });

    return NextResponse.json({
      ...studyPlan,
      plan: JSON.parse(studyPlan.plan),
    });
  } catch (error) {
    console.error("Study plan error:", error);
    return NextResponse.json(
      { error: "Failed to generate study plan" },
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

    const noteId = request.nextUrl.searchParams.get("noteId");

    const plans = await db.studyPlan.findMany({
      where: { userId, ...(noteId ? { noteId } : {}) },
      include: { note: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      plans.map((p) => ({
        ...p,
        plan: JSON.parse(p.plan),
      }))
    );
  } catch (error) {
    console.error("Study plans fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch study plans" }, { status: 500 });
  }
}
