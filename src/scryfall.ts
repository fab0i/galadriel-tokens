import type { TokenDef } from "./types.ts";

const API = "https://api.scryfall.com";
const COLLECTION_BATCH_SIZE = 75;

interface ScryfallImageUris {
  art_crop?: string;
}

interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  type_line: string;
  power?: string;
  toughness?: string;
  image_uris?: ScryfallImageUris;
  card_faces?: { image_uris?: ScryfallImageUris }[];
  all_parts?: { id: string; component: string; type_line: string }[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    const details = await res.json().then(
      (body) => (body as { details?: string }).details,
      () => undefined,
    );
    throw new Error(`Scryfall ${res.status}${details ? `: ${details}` : ""}`);
  }
  return res.json() as Promise<T>;
}

function parseStat(value: string | undefined): number {
  const n = parseInt(value ?? "", 10);
  return Number.isNaN(n) ? 0 : n;
}

function isCreature(typeLine: string): boolean {
  return /\bCreature\b/.test(typeLine);
}

export function toTokenDef(card: ScryfallCard): TokenDef {
  return {
    id: card.oracle_id ?? card.id,
    name: card.name,
    power: parseStat(card.power),
    toughness: parseStat(card.toughness),
    typeLine: card.type_line,
    imageUrl:
      card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop,
  };
}

function dedupe(tokens: TokenDef[]): TokenDef[] {
  return [...new Map(tokens.map((t) => [t.id, t])).values()];
}

export async function searchCreatureTokens(query: string): Promise<TokenDef[]> {
  const q = encodeURIComponent(`t:token t:creature ${query}`);
  try {
    const result = await request<{ data: ScryfallCard[] }>(
      `/cards/search?q=${q}&order=name`,
    );
    return dedupe(
      result.data.filter((c) => isCreature(c.type_line)).map(toTokenDef),
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Scryfall 404"))
      return [];
    throw err;
  }
}

async function fetchCollection(
  identifiers: ({ name: string } | { id: string })[],
): Promise<ScryfallCard[]> {
  const cards: ScryfallCard[] = [];
  for (let i = 0; i < identifiers.length; i += COLLECTION_BATCH_SIZE) {
    const batch = identifiers.slice(i, i + COLLECTION_BATCH_SIZE);
    const result = await request<{ data: ScryfallCard[] }>(
      "/cards/collection",
      {
        method: "POST",
        body: JSON.stringify({ identifiers: batch }),
      },
    );
    cards.push(...result.data);
  }
  return cards;
}

export async function creatureTokensForDeck(
  cardNames: string[],
): Promise<TokenDef[]> {
  const cards = await fetchCollection(cardNames.map((name) => ({ name })));
  const tokenIds = new Set(
    cards.flatMap((c) =>
      (c.all_parts ?? [])
        .filter((p) => p.component === "token" && isCreature(p.type_line))
        .map((p) => p.id),
    ),
  );
  const tokens = await fetchCollection([...tokenIds].map((id) => ({ id })));
  return dedupe(tokens.map(toTokenDef)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

// Accepts plain "1 Card Name" lines plus Moxfield/Archidekt suffixes like "(SET) 123 *F*".
const DECK_LINE = /^\s*(?:\d+x?\s+)?(.+?)(?:\s+\([A-Za-z0-9]+\).*)?\s*$/;

export function parseDecklist(text: string): string[] {
  const names = text
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("//") &&
        !/^(commander|deck|sideboard|maybeboard)\b/i.test(line),
    )
    .map((line) => DECK_LINE.exec(line)?.[1] ?? "")
    .filter(Boolean);
  return [...new Set(names)];
}
