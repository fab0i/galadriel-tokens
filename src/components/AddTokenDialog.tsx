import { useState } from "react";
import {
  creatureTokensForDeck,
  parseDecklist,
  searchCreatureTokens,
} from "../scryfall.ts";
import { useStore } from "../store.ts";
import type { TokenDef } from "../types.ts";
import { Modal } from "./Modal.tsx";
import { Stepper } from "./Stepper.tsx";
import { TokenArt } from "./TokenArt.tsx";

type Tab = "library" | "search" | "custom" | "import";

const TABS: { id: Tab; label: string }[] = [
  { id: "library", label: "My tokens" },
  { id: "search", label: "Search" },
  { id: "custom", label: "Custom" },
  { id: "import", label: "Import deck" },
];

interface TileProps {
  token: TokenDef;
  onSelect: () => void;
  onRemove?: () => void;
}

function TokenTile({ token, onSelect, onRemove }: TileProps) {
  return (
    <div className="token-tile">
      <button className="token-tile-main" onClick={onSelect}>
        <TokenArt token={token} />
        <span className="token-tile-name">{token.name}</span>
        <span className="token-tile-pt">
          {token.power}/{token.toughness}
        </span>
      </button>
      {onRemove && (
        <button
          className="token-tile-remove"
          onClick={onRemove}
          aria-label={`Remove ${token.name} from my tokens`}
        >
          ×
        </button>
      )}
    </div>
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function AddTokenDialog({ onClose }: { onClose: () => void }) {
  const {
    library,
    createToken,
    addToLibrary,
    removeFromLibrary,
    resetLibrary,
  } = useStore();
  const [tab, setTab] = useState<Tab>("library");
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenDef[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPower, setCustomPower] = useState(1);
  const [customToughness, setCustomToughness] = useState(1);
  const [decklist, setDecklist] = useState("");

  const addAndCreate = (token: TokenDef) => {
    addToLibrary([token]);
    createToken(token);
    onClose();
  };

  const runAsync = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add token" onClose={onClose} wide>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id);
              setMessage("");
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "library" && (
        <>
          <div className="tile-grid">
            {library.map((token) => (
              <TokenTile
                key={token.id}
                token={token}
                onSelect={() => {
                  createToken(token);
                  onClose();
                }}
                onRemove={
                  editing ? () => removeFromLibrary(token.id) : undefined
                }
              />
            ))}
          </div>
          <div className="row-inline end">
            {editing && (
              <button className="secondary" onClick={resetLibrary}>
                Reset to defaults
              </button>
            )}
            <button className="secondary" onClick={() => setEditing(!editing)}>
              {editing ? "Done" : "Edit list"}
            </button>
          </div>
        </>
      )}

      {tab === "search" && (
        <>
          <form
            className="row-inline"
            onSubmit={(e) => {
              e.preventDefault();
              void runAsync(async () =>
                setResults(await searchCreatureTokens(query)),
              );
            }}
          >
            <input
              className="text-input"
              placeholder="Squirrel, Spirit, c:w pow=4…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button className="primary" disabled={busy || !query.trim()}>
              Search
            </button>
          </form>
          {results?.length === 0 && (
            <p className="muted">No creature tokens found.</p>
          )}
          <div className="tile-grid">
            {results?.map((token) => (
              <TokenTile
                key={token.id}
                token={token}
                onSelect={() => addAndCreate(token)}
              />
            ))}
          </div>
        </>
      )}

      {tab === "custom" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = customName.trim();
            addAndCreate({
              id: `custom:${name}:${customPower}/${customToughness}`,
              name,
              power: customPower,
              toughness: customToughness,
              typeLine: "Token Creature",
            });
          }}
        >
          <input
            className="text-input full"
            placeholder="Token name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
          />
          <Stepper
            label="Power"
            value={customPower}
            onChange={setCustomPower}
            min={0}
          />
          <Stepper
            label="Toughness"
            value={customToughness}
            onChange={setCustomToughness}
            min={0}
          />
          <button className="primary full" disabled={!customName.trim()}>
            Create {customPower}/{customToughness} {customName.trim()}
          </button>
        </form>
      )}

      {tab === "import" && (
        <>
          <p className="muted">
            Paste a decklist. Its creature tokens get added to My tokens.
          </p>
          <textarea
            className="text-input full"
            rows={8}
            placeholder={"1 Scurry Oak\n1 Tendershoot Dryad\n…"}
            value={decklist}
            onChange={(e) => setDecklist(e.target.value)}
          />
          <button
            className="primary full"
            disabled={busy || !decklist.trim()}
            onClick={() =>
              void runAsync(async () => {
                const tokens = await creatureTokensForDeck(
                  parseDecklist(decklist),
                );
                addToLibrary(tokens);
                setMessage(
                  `Found ${tokens.length} creature tokens: ${tokens.map((t) => t.name).join(", ")}`,
                );
              })
            }
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </>
      )}

      {busy && tab === "search" && <p className="muted">Searching…</p>}
      {message && <p className="message">{message}</p>}
    </Modal>
  );
}
