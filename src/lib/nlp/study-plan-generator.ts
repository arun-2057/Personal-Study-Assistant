export interface StudyPlanDay {
  day: number;
  title: string;
  topics: string[];
  activities: string[];
  duration: string;
}

/**
 * Generate a study plan based on extracted topics
 */
export function generateStudyPlan(
  topics: { term: string; score: number }[],
  totalDays: number = 7
): StudyPlanDay[] {
  if (topics.length === 0) return [];

  // Group topics by importance and create a logical progression
  const sortedTopics = [...topics].sort((a, b) => b.score - a.score);

  // Allocate topics across days, with more topics on important days
  const plan: StudyPlanDay[] = [];
  const topicsPerDay = Math.max(1, Math.ceil(sortedTopics.length / totalDays));

  for (let day = 1; day <= totalDays; day++) {
    const startIndex = (day - 1) * topicsPerDay;
    const dayTopics = sortedTopics.slice(startIndex, startIndex + topicsPerDay);

    if (dayTopics.length === 0) break;

    const topicNames = dayTopics.map((t) => t.term);

    // Determine activity based on day progression
    let activity: string;
    let title: string;

    if (day === 1) {
      title = "Introduction & Core Concepts";
      activity = "Read through the key concepts. Take notes on definitions and fundamental ideas. Focus on understanding the big picture.";
    } else if (day === totalDays) {
      title = "Comprehensive Review & Assessment";
      activity = "Review all topics covered. Take a practice quiz to test your understanding. Identify any remaining weak areas.";
    } else if (day <= Math.ceil(totalDays / 2)) {
      title = `Deep Dive: ${topicNames[0]}`;
      activity = `Study ${topicNames.join(", ")} in detail. Create flashcards or mind maps. Write a brief summary of each concept in your own words.`;
    } else {
      title = `Integration: ${topicNames[0]}`;
      activity = `Connect ${topicNames.join(", ")} with previously learned topics. Look for relationships and patterns. Try explaining these concepts to someone else.`;
    }

    // Calculate recommended study duration
    const avgComplexity = dayTopics.reduce((s, t) => s + Math.min(t.score, 100), 0) / dayTopics.length;
    const duration = avgComplexity > 50 ? "60-90 min" : "30-45 min";

    plan.push({
      day,
      title,
      topics: topicNames,
      activities: activity,
      duration,
    });
  }

  return plan;
}
