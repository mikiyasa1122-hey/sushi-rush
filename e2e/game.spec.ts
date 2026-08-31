import { expect, test } from '@playwright/test';

test('title to active game and pause flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SUSHI RUSH' })).toBeVisible();
  await page.getByRole('button', { name: 'ゲームスタート' }).click();
  await expect(page.getByText('TIME')).toBeVisible();
  await expect(page.getByRole('button', { name: /を握る/ })).toHaveCount(12);
  await page.getByRole('button', { name: '一時停止' }).click();
  await expect(page.getByRole('heading', { name: '一時停止' })).toBeVisible();
  await page.getByRole('button', { name: '続ける' }).click();
  await expect(page.getByText('TIME')).toBeVisible();
});

test('rapid touch presses remain single-fire and the controls stay responsive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲームスタート' }).tap();
  const sushi = page.getByRole('button', { name: /を握る/ });

  for (let index = 0; index < 12; index += 1) await sushi.nth(index).tap();

  await page.getByRole('button', { name: '一時停止' }).tap();
  await expect(page.getByRole('heading', { name: '一時停止' })).toBeVisible();
  await page.getByRole('button', { name: '続ける' }).tap();
  await expect(page.getByText('TIME')).toBeVisible();
});

test('landscape phones keep the game controls available', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');

  const start = page.getByRole('button', { name: 'ゲームスタート' });
  await expect(start).toBeVisible();
  await start.tap();
  await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible();
});
