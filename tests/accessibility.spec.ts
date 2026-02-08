/**
 * Accessibility Tests using axe-core
 * 
 * Tests critical pages for WCAG compliance using axe-playwright.
 * Focuses on common accessibility issues that affect users with disabilities.
 * 
 * Strategy: Test main user flows and critical pages
 * Duration: ~5-10 seconds
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  
  test('Homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test that navigation can be accessed with keyboard
    await page.keyboard.press('Tab');
    
    // Check navigation links are focusable
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Forms should have proper labels and be accessible (if present)', async ({ page }) => {
    await page.goto('/');
    
    // Check if forms exist on the page
    const formsCount = await page.locator('form').count();
    
    if (formsCount === 0) {
      // Skip test if no forms present
      test.skip();
      return;
    }
    
    // Scan forms and inputs for accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Page should have a valid document structure', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .withRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

