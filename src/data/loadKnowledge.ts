
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

import defaultKnowledge from "./knowledge.json";
import type { Knowledge } from "../utils/types";
import { appConfigDir, join } from "@tauri-apps/api/path";

export const bundledKnowledge = defaultKnowledge as Knowledge;

const DIRECTORY = "edi";
const FILE = `${DIRECTORY}/knowledge.json`;

function isValidKnowledge(data: unknown): data is Knowledge {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  if (
    typeof candidate.CONFIG !== "object" ||
    candidate.CONFIG === null ||
    !Array.isArray(candidate.KNOWLEDGE)
  ) {
    return false;
  }

  const config = candidate.CONFIG as Record<string, unknown>;

  return (
    typeof config.welcome === "string" &&
    typeof config.invalid === "string" &&
    candidate.KNOWLEDGE.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Knowledge["KNOWLEDGE"][number]).q === "string" &&
        typeof (item as Knowledge["KNOWLEDGE"][number]).a === "string"
    )
  );
}

export async function loadKnowledge(): Promise<Knowledge> {
  console.log("[EDI] Checking external knowledge...");
  // Ensure the external directory exists.
  await mkdir(DIRECTORY, {
    baseDir: BaseDirectory.AppConfig,
    recursive: true,
  });

  const fileExists = await exists(FILE, {
    baseDir: BaseDirectory.AppConfig,
  });

  console.log("[EDI] External file exists:", fileExists);

  // First launch: create the default knowledge file.
  if (!fileExists) {
    await writeTextFile(
      FILE,
      JSON.stringify(bundledKnowledge, null, 2),
      {
        baseDir: BaseDirectory.AppConfig,
      }
    );

    console.log("Default knowledge.json created.");

    return bundledKnowledge;
  }

  // Read the external knowledge file.
  const contents = await readTextFile(FILE, {
    baseDir: BaseDirectory.AppConfig,
  });

  console.log("[EDI] External file contents:", contents);

  const parsed: unknown = JSON.parse(contents);

  if (!isValidKnowledge(parsed)) {
    throw new Error("External knowledge.json has an invalid structure.");
  }

  console.log("[EDI] External knowledge loaded:", {
    welcome: parsed.CONFIG.welcome,
    questions: parsed.KNOWLEDGE.length,
  });

  const configPath = await join(
    await appConfigDir(),
    DIRECTORY,
    "knowledge.json"
  );

  console.log("EDI knowledge file:", configPath);

  return parsed;
}
