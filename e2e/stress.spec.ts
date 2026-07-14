import { test, expect } from '@playwright/test';

test.describe('Stress Test - Totem Operation', () => {
  test('Should handle rapid reloads and interaction', async ({ page }) => {
    // Navigates to base url
    await page.goto('/');

    // Validate the page title or a specific element
    await expect(page).toHaveTitle(/Octadesk/i);

    // Perform rapid interactions
    for (let i = 0; i < 20; i++) {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      // Espera curta para estressar a renderização sem crashar o playwright
      await page.waitForTimeout(100);
    }
  });
});
