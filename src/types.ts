export interface TokenDef {
  id: string;
  name: string;
  power: number;
  toughness: number;
  typeLine: string;
  imageUrl?: string;
}

export interface StackState {
  tokenId: string;
  power: number;
  toughness: number;
  counters: number;
  tapped: boolean;
  sick: boolean;
}

export interface Stack extends StackState {
  count: number;
}

export interface Settings {
  wakeLock: boolean;
  showEnterCounters: boolean;
}

// Per-game effects (e.g. Hardened Scales) that reset on a new game.
export interface Modifiers {
  enterCounters: number;
  counterAmount: number;
  // Continuous +X/+X per token id (e.g. "Saprolings get +2/+2"). Unlike counters, proliferate ignores it.
  typeBonuses: Record<string, number>;
}
