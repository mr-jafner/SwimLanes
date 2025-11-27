import { test, expect } from '@playwright/test';

/**
 * E2E Test: Application Initialization
 *
 * Verifies that the app loads successfully, database initializes,
 * and the main layout elements are visible.
 */
test('should load the application successfully', async ({ page }) => {
  await page.goto('/');

  // Wait for database initialization to complete
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Verify the app title/branding is visible
  const heading = page.getByRole('heading', { level: 1, name: /swimlanes/i });
  await expect(heading).toBeVisible();

  // Verify the page title
  await expect(page).toHaveTitle(/SwimLanes/i);
});

/**
 * E2E Test: Tab Navigation
 *
 * Verifies that the tab navigation works correctly and switches
 * between different views (Import, Timeline, Branches, History).
 */
test('should navigate between tabs', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Find and click Timeline tab
  const timelineTab = page.getByRole('button', { name: /timeline/i });
  await expect(timelineTab).toBeVisible();
  await timelineTab.click();

  // Verify Timeline canvas container is visible
  const timelineContainer = page.getByTestId('timeline-canvas-container');
  await expect(timelineContainer).toBeVisible();

  // Find and click Import tab
  const importTab = page.getByRole('button', { name: /import/i });
  await expect(importTab).toBeVisible();
  await importTab.click();

  // Verify Import form is visible
  const importHeading = page.getByRole('heading', { name: /import data/i });
  await expect(importHeading).toBeVisible();

  // Find and click Branches tab
  const branchesTab = page.getByRole('button', { name: /branches/i });
  await expect(branchesTab).toBeVisible();
  await branchesTab.click();

  // Verify placeholder panel for Branches
  const branchesTitle = page.getByText('Branch Management');
  await expect(branchesTitle).toBeVisible();

  // Find and click History tab
  const historyTab = page.getByRole('button', { name: /history/i });
  await expect(historyTab).toBeVisible();
  await historyTab.click();

  // Verify placeholder panel for History
  const historyTitle = page.getByText('Version History');
  await expect(historyTitle).toBeVisible();
});

/**
 * E2E Test: Import Tab Content
 *
 * Verifies that the Import tab displays the import form
 * with all expected elements.
 */
test('should display import form in Import tab', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Navigate to Import tab
  const importTab = page.getByRole('button', { name: /import/i });
  await importTab.click();

  // Verify Import form heading
  const heading = page.getByRole('heading', { name: /import data/i });
  await expect(heading).toBeVisible();

  // Verify file input is present
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeVisible();
});

/**
 * E2E Test: Timeline Canvas Rendering
 *
 * Verifies that the Timeline tab displays the interactive canvas
 * and it renders correctly.
 */
test('should display timeline canvas in Timeline tab', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Navigate to Timeline tab
  const timelineTab = page.getByRole('button', { name: /timeline/i });
  await timelineTab.click();

  // Verify canvas container is rendered
  const timelineContainer = page.getByTestId('timeline-canvas-container');
  await expect(timelineContainer).toBeVisible();

  // Verify container has some dimensions (not 0x0)
  const boundingBox = await timelineContainer.boundingBox();
  expect(boundingBox).not.toBeNull();
  expect(boundingBox!.width).toBeGreaterThan(0);
  expect(boundingBox!.height).toBeGreaterThan(0);
});

/**
 * E2E Test: Theme Toggle
 *
 * Verifies that the theme toggle button is present in the header
 * (actual theme switching tested in unit tests).
 */
test('should display theme toggle in header', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Look for theme toggle button (sun/moon icon)
  const themeToggle = page.locator('header button[aria-label*="theme" i], header button svg');
  await expect(themeToggle.first()).toBeVisible();
});

/**
 * E2E Test: Responsive Layout on Mobile
 *
 * Verifies that the app renders correctly on mobile viewports.
 */
test('should render correctly on mobile viewport', async ({ page }) => {
  // Set mobile viewport size
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Verify header is still visible on mobile
  const heading = page.getByRole('heading', { level: 1, name: /swimlanes/i });
  await expect(heading).toBeVisible();

  // Verify tab navigation is still accessible
  const importTab = page.getByRole('button', { name: /import/i });
  await expect(importTab).toBeVisible();
});

/**
 * E2E Test: Tab State Persistence
 *
 * Verifies that the active tab is remembered when navigating away
 * and returning (via localStorage).
 */
test('should persist active tab state', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Navigate to Timeline tab
  const timelineTab = page.getByRole('button', { name: /timeline/i });
  await timelineTab.click();

  // Verify Timeline is active
  const timelineContainer = page.getByTestId('timeline-canvas-container');
  await expect(timelineContainer).toBeVisible();

  // Reload the page
  await page.reload();

  // Wait for app to load again
  await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

  // Verify Timeline tab is still active (container visible)
  await expect(timelineContainer).toBeVisible();
});
