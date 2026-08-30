export interface LeaderboardEntry { name: string; score: number; playedAt: number }

export class LeaderboardRepository {
  private memory: LeaderboardEntry[] = [];
  constructor(private readonly idb: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB) {}

  async list(): Promise<LeaderboardEntry[]> {
    const values = this.idb ? await this.readDatabase().catch(() => this.memory) : this.memory;
    return [...values].sort((a, b) => b.score - a.score || a.playedAt - b.playedAt).slice(0, 10);
  }

  async save(entry: LeaderboardEntry) {
    const name = entry.name.trim().slice(0, 12);
    if (!name) throw new Error('名前を入力してください');
    const next = [...await this.list(), { ...entry, name }].sort((a, b) => b.score - a.score || a.playedAt - b.playedAt).slice(0, 10);
    this.memory = next;
    if (this.idb) await this.writeDatabase(next).catch(() => undefined);
  }

  async clear() {
    this.memory = [];
    if (this.idb) await this.writeDatabase([]).catch(() => undefined);
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.idb!.open('sushi-rush', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('leaderboard', { keyPath: 'playedAt' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async readDatabase(): Promise<LeaderboardEntry[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction('leaderboard').objectStore('leaderboard').getAll();
      req.onsuccess = () => { db.close(); resolve(req.result as LeaderboardEntry[]); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  private async writeDatabase(entries: LeaderboardEntry[]) {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('leaderboard', 'readwrite');
      const store = tx.objectStore('leaderboard');
      store.clear();
      entries.forEach((entry) => store.put(entry));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }
}
