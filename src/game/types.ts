export type SushiId =
  | 'maguro' | 'salmon' | 'ebi' | 'tamago' | 'ika' | 'tako'
  | 'hamachi' | 'anago' | 'ikura' | 'uni' | 'kappa' | 'tekka';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface Order {
  id: string;
  items: readonly SushiId[];
  filled: string[];
  expiresAt: number;
}

export interface GameSnapshot {
  status: GameStatus;
  remainingMs: number;
  score: number;
  combo: number;
  maxCombo: number;
  served: number;
  orders: Order[];
  lastEvent: 'none' | 'served' | 'miss' | 'expired';
}
