import { extractTopics, findKeySentences, extractSentences } from "./topic-extraction";
import { tokenize, removeStopWords } from "./stopwords";

export type QuestionType = "multiple-choice" | "fill-blank" | "true-false";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  points: number;
}

interface QuizGenerationConfig {
  numQuestions?: number;
  includeMultipleChoice?: boolean;
  includeFillBlank?: boolean;
  includeTrueFalse?: boolean;
}

/**
 * Generate quiz questions from text content
 */
export function generateQuiz(
  text: string,
  config: QuizGenerationConfig = {}
): QuizQuestion[] {
  const {
    numQuestions = 10,
    includeMultipleChoice = true,
    includeFillBlank = true,
    includeTrueFalse = true,
  } = config;

  const topics = extractTopics(text, 20);
  const keySentences = findKeySentences(text, 20);
  const sentences = extractSentences(text);

  if (topics.length === 0 || keySentences.length === 0) {
    return [];
  }

  const questions: QuizQuestion[] = [];
  let id = 1;

  // Strategy 1: Fill-in-the-blank from key sentences
  if (includeFillBlank && questions.length < numQuestions) {
    const fillBlanks = generateFillBlankQuestions(keySentences, topics);
    questions.push(...fillBlanks.map((q) => ({ ...q, id: `q${id++}` })));
  }

  // Strategy 2: Multiple choice from key sentences
  if (includeMultipleChoice && questions.length < numQuestions) {
    const mcq = generateMultipleChoiceQuestions(keySentences, sentences, topics);
    questions.push(...mcq.map((q) => ({ ...q, id: `q${id++}` })));
  }

  // Strategy 3: True/false from sentences
  if (includeTrueFalse && questions.length < numQuestions) {
    const tf = generateTrueFalseQuestions(keySentences, topics);
    questions.push(...tf.map((q) => ({ ...q, id: `q${id++}` })));
  }

  // Shuffle and limit
  return shuffleArray(questions).slice(0, numQuestions);
}

/**
 * Strategy 1: Fill-in-the-blank questions
 * Replace key terms with blanks in important sentences
 */
function generateFillBlankQuestions(
  keySentences: ReturnType<typeof findKeySentences>,
  topics: ReturnType<typeof extractTopics>
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const topicTerms = topics.slice(0, 12);

  for (const sentence of keySentences) {
    if (questions.length >= 6) break;

    // Find a topic term in this sentence
    for (const topic of topicTerms) {
      const words = topic.term.toLowerCase().split(" ");
      if (words.every((w) => sentence.text.toLowerCase().includes(w))) {
        const blank = "________";
        const questionText = sentence.text.replace(
          new RegExp(escapeRegex(topic.term), "gi"),
          blank
        );

        if (questionText !== sentence.text && questionText.includes(blank)) {
          questions.push({
            type: "fill-blank",
            question: `Fill in the blank:\n"${questionText}"`,
            correctAnswer: topic.term,
            explanation: `The sentence states: "${sentence.text}"`,
            topic: topic.term,
            points: 2,
          });
          break;
        }
      }
    }
  }

  return questions;
}

/**
 * Strategy 2: Multiple-choice questions
 * Ask "Which of the following..." with distractors from the text
 */
function generateMultipleChoiceQuestions(
  keySentences: ReturnType<typeof findKeySentences>,
  allSentences: ReturnType<typeof extractSentences>,
  topics: ReturnType<typeof extractTopics>
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedSentences = new Set<number>();

  for (const sentence of keySentences) {
    if (questions.length >= 5) break;
    if (usedSentences.has(sentence.index)) continue;

    // Find a topic word in the sentence to ask about
    const sentenceTopics = topics.filter((t) => {
      const words = t.term.toLowerCase().split(" ");
      return words.some((w) => sentence.text.toLowerCase().includes(w));
    });

    if (sentenceTopics.length === 0) continue;

    const mainTopic = sentenceTopics[0];

    // Generate distractors from other sentences
    const allWords = removeStopWords(
      allSentences.flatMap((s) => s.words)
    );
    const otherWords = [...new Set(allWords)].filter(
      (w) =>
        w !== mainTopic.term.toLowerCase() &&
        !sentence.text.toLowerCase().includes(w) &&
        w.length > 3
    );

    const distractors = shuffleArray(otherWords).slice(0, 3);
    if (distractors.length < 3) continue;

    usedSentences.add(sentence.index);

    // Create the question based on sentence type
    let questionText: string;
    if (isDefinitional(sentence.text)) {
      questionText = `According to the text, what is ${mainTopic.term}?`;
    } else {
      questionText = `Which term is most closely associated with the following statement?\n"${sentence.text.substring(0, 120)}..."`;
    }

    const options = shuffleArray([mainTopic.term, ...distractors]);

    questions.push({
      type: "multiple-choice",
      question: questionText,
      options,
      correctAnswer: mainTopic.term,
      explanation: `"${sentence.text}"`,
      topic: mainTopic.term,
      points: 3,
    });
  }

  return questions;
}

/**
 * Strategy 3: True/False questions
 * Use key sentences and slightly modify some for false statements
 */
function generateTrueFalseQuestions(
  keySentences: ReturnType<typeof findKeySentences>,
  topics: ReturnType<typeof extractTopics>
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedSentences = new Set<number>();

  for (const sentence of keySentences) {
    if (questions.length >= 5) break;
    if (usedSentences.has(sentence.index)) continue;

    usedSentences.add(sentence.index);

    // Alternate between true and false
    const isTrue = questions.length % 2 === 0;

    if (isTrue) {
      // True statement: use the sentence as-is
      questions.push({
        type: "true-false",
        question: `True or False: "${sentence.text.substring(0, 150)}${sentence.text.length > 150 ? "..." : ""}"`,
        correctAnswer: "True",
        explanation: "This statement is correct as stated in the text.",
        topic: topics.find((t) => {
          const w = t.term.toLowerCase().split(" ");
          return w.some((word) => sentence.text.toLowerCase().includes(word));
        })?.term || "General",
        points: 1,
      });
    } else {
      // False statement: swap a key term with another topic term
      const topicInSentence = topics.find((t) => {
        const w = t.term.toLowerCase().split(" ");
        return w.some((word) => sentence.text.toLowerCase().includes(word));
      });

      if (!topicInSentence) continue;

      // Find a different topic term to swap in
      const otherTopic = topics.find(
        (t) =>
          t !== topicInSentence &&
          !sentence.text.toLowerCase().includes(t.term.toLowerCase())
      );

      if (!otherTopic) continue;

      const falseText = sentence.text.replace(
        new RegExp(escapeRegex(topicInSentence.term), "gi"),
        otherTopic.term
      );

      if (falseText === sentence.text) continue;

      questions.push({
        type: "true-false",
        question: `True or False: "${falseText.substring(0, 150)}${falseText.length > 150 ? "..." : ""}"`,
        correctAnswer: "False",
        explanation: `The original text states "${topicInSentence.term}" instead of "${otherTopic.term}".`,
        topic: topicInSentence.term,
        points: 1,
      });
    }
  }

  return questions;
}

function isDefinitional(text: string): boolean {
  return /is (a|an|the|defined as|known as)/i.test(text) || /refers to/i.test(text);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
