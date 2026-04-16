export const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought", "used",
  "it", "its", "this", "that", "these", "those", "i", "me", "my", "myself",
  "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself",
  "yourselves", "he", "him", "his", "himself", "she", "her", "hers",
  "herself", "they", "them", "their", "theirs", "themselves", "what",
  "which", "who", "whom", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "about", "above", "after", "again", "against", "also", "am",
  "any", "before", "below", "between", "during", "further", "here", "into",
  "no", "once", "out", "over", "then", "there", "through", "under", "until",
  "up", "upon", "while", "down", "off", "per", "via", "etc", "e.g.", "i.e.",
  "get", "got", "make", "made", "like", "well", "back", "even", "still",
  "way", "take", "come", "know", "see", "new", "now", "look", "think",
  "also", "around", "another", "go", "great", "called", "often", "however",
  "use", "using", "used", "one", "two", "three", "first", "second", "third",
  "many", "much", "well", "since", "including", "example", "examples",
  "include", "includes", "included", "important", "importantly", "therefore",
  "thus", "hence", "consequently", "moreover", "furthermore", "nevertheless",
  "nonetheless", "although", "though", "whereas", "while", "where",
  "whether", "either", "neither", "both", "not", "without", "within",
  "throughout", "during", "before", "after", "between", "among", "against",
  "according", "follow", "follows", "followed", "following", "given",
  "based", "different", "various", "several", "particular", "general",
  "specific", "common", "related", "main", "key", "primary", "major",
  "significant", "basic", "simple", "complex", "high", "low", "large",
  "small", "long", "short", "good", "bad", "right", "wrong", "true", "false",
  "able", "must", "might", "would", "could", "should", "may", "shall",
  "will", "would", "can", "need", "want", "try", "keep", "let", "begin",
  "seem", "help", "show", "turn", "play", "run", "move", "live", "say",
  "said", "tell", "told", "ask", "asked", "work", "give", "find", "found",
  "put", "set", "end", "part", "point", "thing", "things", "number",
  "time", "people", "world", "way", "day", "man", "woman", "child",
  "children", "place", "case", "week", "year", "group", "problem",
  "fact", "idea", "result", "system", "question", "order", "process",
  "data", "information", "study", "model", "method", "analysis",
  "value", "table", "figure", "section", "chapter", "page", "text",
  "word", "words", "sentence", "paragraph", "note", "notes", "term",
  "terms", "concept", "concepts", "topic", "topics", "subject", "subjects",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
}

export function getNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}
