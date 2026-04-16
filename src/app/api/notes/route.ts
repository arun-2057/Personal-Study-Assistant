import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { extractTopics } from "@/lib/nlp/topic-extraction";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const textContent = formData.get("textContent") as string;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let content = textContent || "";
    let fileType = "text";

    // Process PDF file
    if (file) {
      fileType = file.type === "application/pdf" ? "pdf" : file.type;
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === "application/pdf") {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const pdfData = await pdfParse(buffer);
          content = pdfData.text;
        } catch {
          return NextResponse.json(
            { error: "Failed to parse PDF. The file may be corrupted or empty." },
            { status: 400 }
          );
        }
      } else if (file.type.startsWith("text/")) {
        content = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload a PDF or text file." },
          { status: 400 }
        );
      }
    }

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content is too short. Please provide at least a paragraph of text." },
        { status: 400 }
      );
    }

    // Extract topics
    const topics = extractTopics(content, 15);

    const note = await db.note.create({
      data: {
        userId,
        title,
        content,
        fileType,
        topics: JSON.stringify(topics),
      },
    });

    return NextResponse.json({
      ...note,
      topics: JSON.parse(note.topics),
    });
  } catch (error) {
    console.error("Note creation error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
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

    const notes = await db.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { quizzes: true, studyPlans: true },
        },
      },
    });

    return NextResponse.json(
      notes.map((n) => ({
        ...n,
        topics: JSON.parse(n.topics),
      }))
    );
  } catch (error) {
    console.error("Notes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
