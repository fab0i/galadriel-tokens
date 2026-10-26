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
  enterCounters: number;
  counterAmount: number;
  wakeLock: boolean;
}
