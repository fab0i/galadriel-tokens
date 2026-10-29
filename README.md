# Web

## Token Tracker

Static PWA for tracking **creature token stacks** on an iPad during EDH (e.g. Galadriel counter/token lines). Real cards stay on the table; the app only tracks tokens grouped by power/toughness, counters, tapped, and summoning sickness.

**Run locally:** `pnpm install`, then `pnpm dev`. Build with `pnpm build`; output is in `dist/` (host on GitHub Pages, Cloudflare Pages, etc.). Add to the home screen in Safari for offline use after install.

**Features:** token library (defaults from your deck list), Scryfall search, custom tokens, deck import; per-type **+1** (hold for custom P/T and counters); row actions for tap/untap, counters, remove; **+Y/+Y all**, Proliferate, **Start my turn**, **Combat** (pick attackers, see total power, tap them), undo; −/+ around **+Y/+Y all** to change the counter amount, an optional "Tokens enter with" control (enable in settings; both values reset and undo with a new game), plus settings for wake lock and new game. State persists in `localStorage`.

**Refresh default library from a decklist:** `pnpm default-tokens path/to/decklist.txt` (writes `src/defaultTokens.json`).
