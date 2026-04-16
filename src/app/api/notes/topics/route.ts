import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { extractTopics } from "@/lib/nlp/topic-extraction";

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

    const note = await db.note.findFirst({ where: { id, userId } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Re-extract topics with fresh analysis
    const topics = extractTopics(note.content, 15);

    // Update the note with new topics
    await db.note.update({
      where: { id },
      data: { topics: JSON.stringify(topics) },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Topic extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract topics" },
      { status: 500 }
    );
  }
}
