import "server-only";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { env } from "@/lib/env";

const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768;
const MAX_CHARS = 6000;
const BATCH_SIZE = 50;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const responseSchema = z.object({
  embeddings: z.array(z.object({ values: z.array(z.number()) })),
});

export function embeddingsEnabled(): boolean {
  return env.GEMINI_API_KEY !== undefined;
}

function normalize(vector: number[]): number[] {
  const length = Math.hypot(...vector);
  return length > 0 ? vector.map((value) => value / length) : vector;
}

async function embed(texts: string[], taskType: TaskType): Promise<number[][]> {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text: text.slice(0, MAX_CHARS) }] },
        taskType,
        outputDimensionality: DIMENSIONS,
      })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Embedding request failed with status ${response.status}.`);
  }
  const { embeddings } = responseSchema.parse(await response.json());
  // Vectors below the full 3072 dimensions are not normalised by the API.
  return embeddings.map((embedding) => normalize(embedding.values));
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += (a[index] ?? 0) * (b[index] ?? 0);
  }
  return dot;
}

let pending: Promise<void> | null = null;

/** Embeds documents that have no vector yet (new, edited or after a reset). */
export function embedMissingDocuments(): Promise<void> {
  if (!embeddingsEnabled()) return Promise.resolve();
  pending ??= (async () => {
    const repository = getRepository();
    const items = (await repository.listItemsWithoutEmbedding()).filter(
      (item) => item.kind === "document",
    );
    for (let start = 0; start < items.length; start += BATCH_SIZE) {
      const batch = items.slice(start, start + BATCH_SIZE);
      const vectors = await embed(
        batch.map((item) => `${item.title}\n\n${item.body}`),
        "RETRIEVAL_DOCUMENT",
      );
      await Promise.all(
        batch.map((item, index) => {
          const vector = vectors[index];
          return vector ? repository.setEmbedding(item.id, vector) : undefined;
        }),
      );
    }
  })().finally(() => {
    pending = null;
  });
  return pending;
}

const queryCache = new Map<string, number[]>();

export async function embedQuery(question: string): Promise<number[]> {
  const cached = queryCache.get(question);
  if (cached) return cached;
  const [vector] = await embed([question], "RETRIEVAL_QUERY");
  if (!vector) {
    throw new Error("No embedding returned for the question.");
  }
  queryCache.set(question, vector);
  return vector;
}
