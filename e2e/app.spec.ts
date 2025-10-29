import { test, expect } from '@playwright/test';

/**
 * E2E Test Flow: Application Loading and Basic Rendering
 *
 * This test verifies that the application loads successfully and displays
 * the main UI elements. It's the most basic smoke test to ensure the app
 * doesn't crash on startup.
 */
test('should load the application and display main heading', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Wait for the app to be fully loaded by checking for the main heading
  const heading = page.getByRole('heading', { level: 1, name: /swimlanes/i });
  await expect(heading).toBeVisible();

  // Verify the page title
  await expect(page).toHaveTitle(/SwimLanes/i);
});

/**
 * E2E Test Flow: Button Component Interactions
 *
 * This test verifies that the shadcn/ui Button components are rendered
 * correctly with different variants and that they respond to user clicks.
 */
test('should display and interact with button variants', async ({ page }) => {
  await page.goto('/');

  // Verify all button variants are visible
  const defaultButton = page.getByRole('button', { name: /^default$/i });
  const secondaryButton = page.getByRole('button', { name: /^secondary$/i });
  const destructiveButton = page.getByRole('button', { name: /^destructive$/i });
  const outlineButton = page.getByRole('button', { name: /^outline$/i });
  const ghostButton = page.getByRole('button', { name: /^ghost$/i });

  await expect(defaultButton).toBeVisible();
  await expect(secondaryButton).toBeVisible();
  await expect(destructiveButton).toBeVisible();
  await expect(outlineButton).toBeVisible();
  await expect(ghostButton).toBeVisible();

  // Verify buttons are clickable (not disabled)
  await expect(defaultButton).toBeEnabled();
  await expect(secondaryButton).toBeEnabled();
});

/**
 * E2E Test Flow: Dialog Component Open/Close Workflow
 *
 * This test simulates a user opening a dialog modal and then closing it.
 * This is a common UI pattern that needs to work reliably.
 *
 * Flow:
 * 1. User clicks "Open Dialog" button
 * 2. Dialog appears with title and description
 * 3. User clicks "Close" button
 * 4. Dialog disappears
 */
test('should open and close dialog component', async ({ page }) => {
  await page.goto('/');

  // Initially, dialog should not be visible
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Click the "Open Dialog" button
  const openDialogButton = page.getByRole('button', { name: /open dialog/i });
  await openDialogButton.click();

  // Dialog should now be visible with correct content
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/swimlanes dialog/i)).toBeVisible();
  await expect(dialog.getByText(/this is a dialog component from shadcn\/ui/i)).toBeVisible();

  // Close the dialog by pressing Escape key (common pattern)
  await page.keyboard.press('Escape');

  // Dialog should be closed
  await expect(dialog).not.toBeVisible();
});

/**
 * E2E Test Flow: Select Component Interaction
 *
 * This test verifies that dropdown select components work correctly.
 *
 * Flow:
 * 1. User clicks on select trigger
 * 2. Dropdown opens with options
 * 3. User selects an option
 * 4. Selected value is displayed
 */
test('should interact with select component', async ({ page }) => {
  await page.goto('/');

  // Find the select trigger button
  const selectTrigger = page.getByRole('combobox').first();
  await expect(selectTrigger).toBeVisible();

  // Click to open the dropdown
  await selectTrigger.click();

  // Select an option (e.g., "Milestone")
  const milestoneOption = page.getByRole('option', { name: /milestone/i });
  await expect(milestoneOption).toBeVisible();
  await milestoneOption.click();

  // Verify the selected value is now displayed in the trigger
  await expect(selectTrigger).toHaveText(/milestone/i);
});

/**
 * E2E Test Flow: Toast Notification Display
 *
 * This test verifies that toast notifications (temporary popup messages)
 * appear when triggered by user actions.
 *
 * Flow:
 * 1. User clicks "Show Toast" button
 * 2. Toast notification appears with message
 * 3. Toast includes description text
 */
test('should display toast notifications', async ({ page }) => {
  await page.goto('/');

  // Click the "Default Toast" button
  const defaultToastButton = page.getByRole('button', { name: /^default toast$/i });
  await defaultToastButton.click();

  // Verify toast appears with correct content
  const toastMessage = page.getByText(/this is a default toast/i);
  await expect(toastMessage).toBeVisible();

  // Test success toast
  const successToastButton = page.getByRole('button', { name: /success toast/i });
  await successToastButton.click();
  const successMessage = page.getByText(/operation completed successfully/i);
  await expect(successMessage).toBeVisible();
});

/**
 * E2E Test Flow: Custom Theme Colors Display
 *
 * This test verifies that SwimLanes custom theme colors (for tasks,
 * milestones, releases, meetings) are properly applied and visible.
 *
 * This ensures the Tailwind v4 configuration is working correctly.
 */
test('should display custom SwimLanes theme colors', async ({ page }) => {
  await page.goto('/');

  // Verify custom theme colors section is visible
  const customColorsHeading = page.getByRole('heading', {
    name: /swimlanes custom colors/i,
  });
  await expect(customColorsHeading).toBeVisible();

  // Verify all color type headings are present
  await expect(page.getByRole('heading', { name: /^task$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^milestone$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^release$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^meeting$/i })).toBeVisible();

  // Verify descriptions
  await expect(page.getByText(/blue bars for work items/i)).toBeVisible();
  await expect(page.getByText(/green diamonds for markers/i)).toBeVisible();
  await expect(page.getByText(/orange bars for deployments/i)).toBeVisible();
  await expect(page.getByText(/purple bars for events/i)).toBeVisible();
});

/**
 * E2E Test Flow: Mobile Responsiveness Check
 *
 * This test verifies that the app renders correctly on mobile viewports.
 * It's important for ensuring responsive design works.
 */
test('should render correctly on mobile viewport', async ({ page }) => {
  // Set mobile viewport size
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Verify main heading is still visible on mobile
  const heading = page.getByRole('heading', { level: 1, name: /swimlanes/i });
  await expect(heading).toBeVisible();

  // Verify buttons are still accessible on mobile
  const defaultButton = page.getByRole('button', { name: /^default$/i });
  await expect(defaultButton).toBeVisible();
});
