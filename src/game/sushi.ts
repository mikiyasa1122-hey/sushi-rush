import type { SushiId } from './types';

export interface SushiDefinition { id: SushiId; name: string; emoji: string; color: string }

export const SUSHI: SushiDefinition[] = [
  { id: 'maguro', name: 'まぐろ', emoji: '🍣', color: '#ef3340' },
  { id: 'salmon', name: 'サーモン', emoji: '🍣', color: '#ff7b35' },
  { id: 'ebi', name: 'えび', emoji: '🦐', color: '#f58ba1' },
  { id: 'tamago', name: 'たまご', emoji: '🍳', color: '#f7c928' },
  { id: 'ika', name: 'いか', emoji: '🦑', color: '#dceef0' },
  { id: 'tako', name: 'たこ', emoji: '🐙', color: '#bd405d' },
  { id: 'hamachi', name: 'はまち', emoji: '🐟', color: '#deb768' },
  { id: 'anago', name: 'あなご', emoji: '🍣', color: '#9b542e' },
  { id: 'ikura', name: 'いくら', emoji: '🟠', color: '#f05a24' },
  { id: 'uni', name: 'うに', emoji: '🟡', color: '#e7a62b' },
  { id: 'kappa', name: 'かっぱ巻', emoji: '🥒', color: '#64a832' },
  { id: 'tekka', name: '鉄火巻', emoji: '🔴', color: '#aa2334' },
];

export const sushiById = (id: SushiId) => SUSHI.find((s) => s.id === id)!;
