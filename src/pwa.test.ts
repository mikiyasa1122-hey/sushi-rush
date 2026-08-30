// @vitest-environment node
import { readFile } from 'node:fs/promises';

describe('PWA package', () => {
  it('provides an installable Japanese manifest', async () => {
    const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'));
    expect(manifest.name).toBe('SUSHI RUSH');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
