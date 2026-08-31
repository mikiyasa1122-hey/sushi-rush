import { LeaderboardRepository } from '../platform/leaderboard';
import { createLocalApi, type GameSettings, type SettingsStore } from './local-api';

const defaults: GameSettings = { voice: true, effects: true, vibration: true };

const createSettingsStore = (): SettingsStore & { value: unknown } => ({
  value: defaults,
  read() { return this.value; },
  write(value) { this.value = value; },
});

describe('offline Hono API', () => {
  it('stores and returns validated settings without network access', async () => {
    const store = createSettingsStore();
    const app = createLocalApi({ leaderboard: new LeaderboardRepository(undefined), settings: store });

    const saved = await app.request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voice: false, effects: true, vibration: false }),
    });

    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ voice: false, effects: true, vibration: false });
    const loaded = await app.request('/api/settings');
    expect(await loaded.json()).toEqual({ voice: false, effects: true, vibration: false });
  });

  it('rejects malformed settings with a stable 400 response', async () => {
    const app = createLocalApi({ leaderboard: new LeaderboardRepository(undefined), settings: createSettingsStore() });
    const response = await app.request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voice: 'on', effects: true }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
  });

  it('validates ranking entries and returns them in score order', async () => {
    const app = createLocalApi({ leaderboard: new LeaderboardRepository(undefined), settings: createSettingsStore() });
    for (const entry of [
      { name: '並', score: 200, playedAt: 2 },
      { name: '上', score: 500, playedAt: 1 },
    ]) {
      const response = await app.request('/api/ranking', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry),
      });
      expect(response.status).toBe(201);
    }

    const response = await app.request('/api/ranking');
    expect(await response.json()).toEqual([
      { name: '上', score: 500, playedAt: 1 },
      { name: '並', score: 200, playedAt: 2 },
    ]);
  });

  it('rejects invalid ranking values before they reach storage', async () => {
    const app = createLocalApi({ leaderboard: new LeaderboardRepository(undefined), settings: createSettingsStore() });
    const response = await app.request('/api/ranking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '職人', score: -1, playedAt: 1 }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
    expect(await (await app.request('/api/ranking')).json()).toEqual([]);
  });
});
