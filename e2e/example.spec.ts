import { expect, test } from '@playwright/test'

// Example browser test. Replace with real user-flow tests.
// Browser tests verify behaviour at the UI layer — unit tests cover logic.
// Rule: one spec file per feature or user journey.

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
})
