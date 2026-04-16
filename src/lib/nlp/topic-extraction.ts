import { tokenize, removeStopWords, getNgrams } from "./stopwords";

export interface ExtractedTopic {
  term: string;
  score: number;
  count: number;
}

export interface Sentence {
  text: string;
  index: number;
  words: string[];
}

/**
 * Extract sentences from text
 */
export function extractSentences(text: string): Sentence[] {
  const raw = text
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  return raw.map((text, index) => ({
    text,
    index,
    words: tokenize(text),
  }));
}

/**
 * Calculate term frequency for a list of tokens
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

/**
 * Extract key topics using TF-based scoring with bigram and trigram support
 */
export function extractTopics(
  text: string,
  maxTopics: number = 15
): ExtractedTopic[] {
  const sentences = extractSentences(text);
  if (sentences.length === 0) return [];

  // Get all words and filtered words
  const allWords = sentences.flatMap((s) => s.words);
  const filtered = removeStopWords(allWords);
  const filteredUnique = [...new Set(filtered)];

  // Calculate word frequency
  const wordFreq = termFrequency(filtered);
  const maxFreq = Math.max(...wordFreq.values(), 1);

  // Calculate TF scores for unigrams
  const unigramScores = new Map<string, number>();
  for (const [word, count] of wordFreq) {
    // Normalize TF score
    const tf = (count / maxFreq) * 100;
    // Boost words that appear in multiple sentences (more "topic-like")
    const sentenceSpread = sentences.filter((s) =>
      s.words.some((w) => w === word)
    ).length;
    const spreadFactor = Math.min(sentenceSpread / sentences.length, 1);
    unigramScores.set(word, tf * (0.5 + 0.5 * spreadFactor));
  }

  // Extract bigrams
  const bigrams = getNgrams(filtered, 2);
  const bigramFreq = termFrequency(bigrams);
  const bigramScores = new Map<string, number>();
  for (const [bigram, count] of bigramFreq) {
    if (count >= 2) {
      bigramScores.set(bigram, count * 30);
    }
  }

  // Extract trigrams
  const trigrams = getNgrams(filtered, 3);
  const trigramFreq = termFrequency(trigrams);
  const trigramScores = new Map<string, number>();
  for (const [trigram, count] of trigramFreq) {
    if (count >= 2) {
      trigramScores.set(trigram, count * 50);
    }
  }

  // Merge: remove unigrams that are part of higher-scoring n-grams
  const topics: ExtractedTopic[] = [];
  const usedWords = new Set<string>();

  // Add trigrams first (highest score)
  for (const [trigram, score] of trigramScores) {
    topics.push({
      term: trigram,
      score: Math.round(score * 100) / 100,
      count: trigramFreq.get(trigram) || 0,
    });
    trigram.split(" ").forEach((w) => usedWords.add(w));
  }

  // Add bigrams
  for (const [bigram, score] of bigramScores) {
    const words = bigram.split(" ");
    if (words.some((w) => usedWords.has(w))) continue;
    topics.push({
      term: bigram,
      score: Math.round(score * 100) / 100,
      count: bigramFreq.get(bigram) || 0,
    });
    words.forEach((w) => usedWords.add(w));
  }

  // Add unigrams
  for (const [word, score] of unigramScores) {
    if (usedWords.has(word)) continue;
    if (score < 10) continue; // Threshold to filter noise
    topics.push({
      term: word,
      score: Math.round(score * 100) / 100,
      count: wordFreq.get(word) || 0,
    });
  }

  // Sort by score and return top topics
  return topics
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTopics);
}

/**
 * Find key sentences (likely containing definitions or important facts)
 */
export function findKeySentences(
  text: string,
  maxSentences: number = 10
): Sentence[] {
  const sentences = extractSentences(text);
  if (sentences.length === 0) return [];

  const topics = extractTopics(text, 30);
  const topicWords = new Set(topics.map((t) => t.term.toLowerCase().split(" ")).flat());

  // Score sentences by how many topic words they contain
  const scored = sentences.map((s) => {
    const topicCount = s.words.filter((w) => topicWords.has(w)).length;
    const lengthBonus = Math.min(s.words.length / 30, 1); // Prefer medium-length sentences
    const keywordBonus = isDefinitionLike(s.text) ? 5 : 0;
    return { ...s, score: topicCount * 10 + lengthBonus * 5 + keywordBonus };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences);
}

/**
 * Check if a sentence looks like a definition
 */
function isDefinitionLike(text: string): boolean {
  const definitionPatterns = [
    /is (a|an|the|defined as)/i,
    /refers to/i,
    /means? (that|to be)/i,
    /can be (defined|described|understood)/i,
    /is (known|considered|regarded)/i,
    /are (types|kinds|forms|examples)/i,
    /involves? (the|a|using)/i,
    /describes? (the|a|how)/i,
  ];
  return definitionPatterns.some((p) => p.test(text));
}
