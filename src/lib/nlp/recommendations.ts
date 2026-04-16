import { db } from "@/lib/db";
import type { QuizResult, Note } from "@prisma/client";

export interface TopicRecommendation {
  topic: string;
  noteId: string;
  noteTitle: string;
  averageScore: number;
  attempts: number;
  priority: "high" | "medium" | "low";
  message: string;
}

/**
 * Analyze quiz results and recommend topics to review
 */
export async function getRecommendations(userId: string): Promise<TopicRecommendation[]> {
  // Get all quiz results for the user with quiz info
  const results = await db.quizResult.findMany({
    where: { userId },
    include: {
      quiz: {
        include: { note: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (results.length === 0) return [];

  // Parse questions from each quiz to extract topic performance
  const topicStats = new Map<string, {
    noteId: string;
    noteTitle: string;
    totalPoints: number;
    earnedPoints: number;
    attempts: number;
  }>();

  for (const result of results) {
    const questions = parseJSON(result.quiz.questions);
    const answers = parseJSON(result.answers);

    if (!Array.isArray(questions)) continue;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const topic = question.topic || "General";
      const isCorrect = checkAnswer(question, answers?.[i]);

      const existing = topicStats.get(topic);
      if (existing) {
        existing.totalPoints += question.points || 1;
        if (isCorrect) existing.earnedPoints += question.points || 1;
        existing.attempts++;
      } else {
        topicStats.set(topic, {
          noteId: result.quiz.noteId,
          noteTitle: result.quiz.note?.title || "Unknown",
          totalPoints: question.points || 1,
          earnedPoints: isCorrect ? (question.points || 1) : 0,
          attempts: 1,
        });
      }
    }
  }

  // Convert to recommendations
  const recommendations: TopicRecommendation[] = [];
  for (const [topic, stats] of topicStats) {
    const avgScore = (stats.earnedPoints / stats.totalPoints) * 100;
    let priority: "high" | "medium" | "low";
    let message: string;

    if (avgScore < 40) {
      priority = "high";
      message = `You scored ${avgScore.toFixed(0)}% on "${topic}". This topic needs significant review. Re-read the source material and try creating flashcards.`;
    } else if (avgScore < 70) {
      priority = "medium";
      message = `You scored ${avgScore.toFixed(0)}% on "${topic}". Review the key concepts and try a practice quiz.`;
    } else if (avgScore < 90) {
      priority = "low";
      message = `You scored ${avgScore.toFixed(0)}% on "${topic}". Looking good! A quick review will help solidify your knowledge.`;
    } else {
      continue; // Skip mastered topics
    }

    recommendations.push({
      topic,
      noteId: stats.noteId,
      noteTitle: stats.noteTitle,
      averageScore: Math.round(avgScore),
      attempts: stats.attempts,
      priority,
      message,
    });
  }

  // Sort by priority (high first), then by score (lowest first)
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.averageScore - b.averageScore;
  });
}

/**
 * Get study statistics for the dashboard
 */
export async function getStudyStats(userId: string) {
  const [totalNotes, totalQuizzes, totalResults] = await Promise.all([
    db.note.count({ where: { userId } }),
    db.quiz.count({ where: { userId } }),
    db.quizResult.count({ where: { userId } }),
  ]);

  // Calculate average score
  const results = await db.quizResult.findMany({
    where: { userId },
  });

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) /
            results.length
        )
      : 0;

  // Get recent activity
  const recentResults = await db.quizResult.findMany({
    where: { userId },
    include: { quiz: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    totalNotes,
    totalQuizzes,
    totalResults,
    avgScore,
    recentResults: recentResults.map((r) => ({
      quizTitle: r.quiz.title,
      score: r.score,
      total: r.total,
      date: r.createdAt,
    })),
  };
}

function parseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function checkAnswer(question: any, userAnswer: unknown): boolean {
  if (userAnswer === undefined || userAnswer === null) return false;

  const correct = question.correctAnswer?.toLowerCase();
  const given = typeof userAnswer === "string" ? userAnswer.toLowerCase() : String(userAnswer).toLowerCase();

  return correct === given;
}
