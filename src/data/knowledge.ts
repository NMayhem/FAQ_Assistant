import knowledge from "./knowledge.json";
import type { KnowledgeItem } from "../utils/types";

interface KnowledgeConfig {
  welcome: string;
  invalid: string;
}

interface Knowledge {
  CONFIG: KnowledgeConfig;
  KNOWLEDGE: KnowledgeItem[];
}

export const faq = knowledge as Knowledge;