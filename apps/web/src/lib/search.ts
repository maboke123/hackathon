import "server-only";
import { getRepository, type KnowledgeItem } from "@/lib/data";
import {
  cosine,
  embeddingsEnabled,
  embedMissingDocuments,
  embedQuery,
} from "@/lib/embeddings";

const KEYWORD_WEIGHT = 0.5;
const MIN_KEYWORD = 0.3;
const MIN_MEANING = 0.75;

export type SearchHit = {
  item: KnowledgeItem;
  /** 0 to 1, keyword rank and meaning combined. */
  relevance: number;
  matchedBy: "keyword" | "meaning" | "both";
};

async function meaningScores(question: string): Promise<Map<string, number>> {
  if (!embeddingsEnabled()) return new Map();
  try {
    await embedMissingDocuments();
    const [query, embeddings] = await Promise.all([
      embedQuery(question),
      getRepository().listEmbeddings(),
    ]);
    const similarities = embeddings.map(({ id, embedding }) => ({
      id,
      similarity: cosine(query, embedding),
    }));
    const values = similarities.map((entry) => entry.similarity);
    const min = Math.min(...values);
    const spread = Math.max(...values) - min || 1;
    return new Map(
      similarities.map(({ id, similarity }) => [
        id,
        (similarity - min) / spread,
      ]),
    );
  } catch (error) {
    console.warn("Semantic search unavailable, using keywords only.", error);
    return new Map();
  }
}

/** Keyword search plus, when a Gemini key is set, search by meaning. */
export async function searchDocuments(
  question: string,
  terms: string[],
): Promise<SearchHit[]> {
  const repository = getRepository();
  const [keywordResults, documents, meaning] = await Promise.all([
    repository.searchItems(terms.join(" "), { kind: "document" }),
    repository.listItems({ kind: "document" }),
    meaningScores(question),
  ]);
  const topRank = keywordResults[0]?.rank ?? 0;
  const keyword = new Map(
    keywordResults.map((result) => [
      result.item.id,
      topRank > 0 ? result.rank / topRank : 0,
    ]),
  );
  const useMeaning = meaning.size > 0;

  return documents
    .flatMap((item): SearchHit[] => {
      const byKeyword = keyword.get(item.id) ?? 0;
      const byMeaning = meaning.get(item.id) ?? 0;
      const keywordHit = byKeyword >= MIN_KEYWORD;
      const meaningHit = useMeaning && byMeaning >= MIN_MEANING;
      if (!keywordHit && !meaningHit) return [];
      return [
        {
          item,
          relevance: useMeaning
            ? KEYWORD_WEIGHT * byKeyword + (1 - KEYWORD_WEIGHT) * byMeaning
            : byKeyword,
          matchedBy:
            keywordHit && meaningHit
              ? "both"
              : keywordHit
                ? "keyword"
                : "meaning",
        },
      ];
    })
    .sort((a, b) => b.relevance - a.relevance);
}
