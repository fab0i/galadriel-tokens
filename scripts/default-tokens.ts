import { readFileSync, writeFileSync } from "node:fs";
import { creatureTokensForDeck, parseDecklist } from "../src/scryfall.ts";

const deckPath = process.argv[2];
if (!deckPath) {
  console.error("Usage: npm run default-tokens -- <decklist.txt>");
  process.exit(1);
}

const nodeFetch = globalThis.fetch;
globalThis.fetch = (input, init) =>
  nodeFetch(input, {
    ...init,
    headers: { ...init?.headers, "User-Agent": "token-tracker/0.1" },
  });

const tokens = await creatureTokensForDeck(
  parseDecklist(readFileSync(deckPath, "utf8")),
);
const outPath = new URL("../src/defaultTokens.json", import.meta.url);
writeFileSync(outPath, `${JSON.stringify(tokens, null, 2)}\n`);
console.log(
  `Wrote ${tokens.length} tokens: ${tokens.map((t) => `${t.name} ${t.power}/${t.toughness}`).join(", ")}`,
);
