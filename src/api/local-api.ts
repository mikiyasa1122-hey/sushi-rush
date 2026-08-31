import { Hono } from 'hono';
import { z } from 'zod';
import type { LeaderboardEntry, LeaderboardRepository } from '../platform/leaderboard';

export const gameSettingsSchema = z.object({
  voice: z.boolean(),
  effects: z.boolean(),
  vibration: z.boolean(),
}).strict();

export const leaderboardEntrySchema = z.object({
  name: z.string().trim().min(1).max(12),
  score: z.number().int().nonnegative(),
  playedAt: z.number().int().nonnegative(),
}).strict();

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export interface SettingsStore {
  read(): unknown | Promise<unknown>;
  write(settings: GameSettings): void | Promise<void>;
}

export interface LocalApiDependencies {
  leaderboard: LeaderboardRepository;
  settings?: SettingsStore;
}

const defaultSettings: GameSettings = { voice: true, effects: true, vibration: true };

const browserSettingsStore: SettingsStore = {
  read() {
    try {
      const value = localStorage.getItem('sushi-rush-settings');
      return value ? JSON.parse(value) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },
  write(settings) {
    try { localStorage.setItem('sushi-rush-settings', JSON.stringify(settings)); }
    catch { /* The in-memory React state remains usable when storage is unavailable. */ }
  },
};

const parseBody = async (request: Request) => {
  try { return await request.json(); }
  catch { return undefined; }
};

export const createLocalApi = ({ leaderboard, settings = browserSettingsStore }: LocalApiDependencies) => {
  const app = new Hono();

  app.get('/api/settings', async (context) => {
    const parsed = gameSettingsSchema.safeParse(await settings.read());
    return context.json(parsed.success ? parsed.data : defaultSettings);
  });

  app.put('/api/settings', async (context) => {
    const parsed = gameSettingsSchema.safeParse(await parseBody(context.req.raw));
    if (!parsed.success) return context.json({ error: 'invalid_request' } as const, 400);
    await settings.write(parsed.data);
    return context.json(parsed.data);
  });

  app.get('/api/ranking', async (context) => context.json(await leaderboard.list()));

  app.post('/api/ranking', async (context) => {
    const parsed = leaderboardEntrySchema.safeParse(await parseBody(context.req.raw));
    if (!parsed.success) return context.json({ error: 'invalid_request' } as const, 400);
    await leaderboard.save(parsed.data);
    return context.json(parsed.data, 201);
  });

  return app;
};

export class LocalGameApi {
  constructor(private readonly app: ReturnType<typeof createLocalApi>) {}

  async loadSettings(): Promise<GameSettings> {
    const response = await this.app.request('/api/settings');
    return gameSettingsSchema.parse(await response.json());
  }

  async saveSettings(settings: GameSettings): Promise<GameSettings> {
    const response = await this.request('/api/settings', 'PUT', settings);
    return gameSettingsSchema.parse(await response.json());
  }

  async listRanking(): Promise<LeaderboardEntry[]> {
    const response = await this.app.request('/api/ranking');
    return z.array(leaderboardEntrySchema).parse(await response.json());
  }

  async saveRanking(entry: LeaderboardEntry): Promise<void> {
    await this.request('/api/ranking', 'POST', entry);
  }

  private async request(path: string, method: 'PUT' | 'POST', body: unknown) {
    const response = await this.app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('ローカルAPIへの保存に失敗しました');
    return response;
  }
}
