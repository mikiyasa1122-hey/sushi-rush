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
