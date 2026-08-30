import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/game-engine';
import type { SushiId } from '../game/types';

export function useGame() {
  const engine = useRef(new GameEngine());
  const [snapshot, setSnapshot] = useState(engine.current.snapshot());
  const sync = useCallback(() => setSnapshot(engine.current.snapshot()), []);
  useEffect(() => {
    if (snapshot.status !== 'playing') return;
    let previous = performance.now();
    const timer = window.setInterval(() => { const now = performance.now(); engine.current.tick(now - previous); previous = now; sync(); }, 100);
    return () => window.clearInterval(timer);
  }, [snapshot.status, sync]);
  return { snapshot, start: () => { engine.current.start(); sync(); }, tap: (id: SushiId) => { engine.current.tap(id); const next = engine.current.snapshot(); setSnapshot(next); return next; }, pause: () => { engine.current.pause(); sync(); }, resume: () => { engine.current.resume(); sync(); } };
}
