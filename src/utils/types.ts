export interface KnowledgeItem {
  q: string;
  a: string;
}

export interface KnowledgeConfig {
  welcome: string;
  invalid: string;
}

export interface Knowledge {
  CONFIG: KnowledgeConfig;
  KNOWLEDGE: KnowledgeItem[];
}
