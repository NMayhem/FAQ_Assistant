import type { KnowledgeItem } from "./types";

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findAnswer(
  text: string,
  knowledge: KnowledgeItem[],
): string | null {
  const norm = normalize(text);

  if (!norm) {
    return null;
  }

  // Exact match
  for (const item of knowledge) {
    if (normalize(item.q) === norm) {
      return item.a;
    }
  }

  // Partial match
  for (const item of knowledge) {
    const question = normalize(item.q);

    if (norm.includes(question) || question.includes(norm)) {
      return item.a;
    }
  }

  // Word matching
  let best: KnowledgeItem | null = null;
  let bestScore = 0;

  const words = norm.split(" ");

  for (const item of knowledge) {
    let score = 0;
    const question = normalize(item.q);

    for (const word of words) {
      if (word.length > 2 && question.includes(word)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= 1 ? best?.a ?? null : null;
}
