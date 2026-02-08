/**
 * Visual Regression Tests for Homepage
 * 
 * Streamlined visual regression testing focused on critical homepage rendering.
 * Tests verify that key sections render correctly for users across different viewports.
 * 
 * Strategy: Screenshot comparison of critical sections rather than full page
 * to keep CI execution fast while catching visual breaking changes.
 */

import { test, expect } from '@playwright/test';

// Critical viewports to test (covering 90%+ of users)
const CRITICAL_VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE - most common mobile
  tablet: { width: 768, height: 1024 },     // iPad - most common tablet  
  desktop: { width: 1920, height: 1080 },   // Desktop FHD - most common desktop
};

test.describe('Visual Regression - Homepage Critical Sections', () => {
  
  test('Hero Section - Mobile', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.mobile);
    await page.goto('/');
    
    // Wait for hero section to be visible
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    // Take screenshot of hero section only (faster than full page)
    await expect(hero).toHaveScreenshot('hero-mobile.png', {
      maxDiffPixels: 100, // Allow minor rendering differences
    });
  });
  
  test('Hero Section - Desktop', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.desktop);
    await page.goto('/');
    
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    await expect(hero).toHaveScreenshot('hero-desktop.png', {
      maxDiffPixels: 100,
    });
  });
  
  test('Navigation Header - Mobile', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.mobile);
    await page.goto('/');
    
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    await expect(header).toHaveScreenshot('header-mobile.png', {
      maxDiffPixels: 50,
    });
  });
  
  test('Navigation Header - Desktop', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.desktop);
    await page.goto('/');
    
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    await expect(header).toHaveScreenshot('header-desktop.png', {
      maxDiffPixels: 50,
    });
  });
  
  test('Programs Section Grid Layout - Desktop', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.desktop);
    await page.goto('/');
    
    // Scroll to programs section
    const programsSection = page.locator('.programs-grid').first();
    await programsSection.scrollIntoViewIfNeeded();
    await expect(programsSection).toBeVisible();
    
    await expect(programsSection).toHaveScreenshot('programs-grid-desktop.png', {
      maxDiffPixels: 100,
    });
  });
  
  test('Footer - Desktop', async ({ page }) => {
    await page.setViewportSize(CRITICAL_VIEWPORTS.desktop);
    await page.goto('/');
    
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    
    await expect(footer).toHaveScreenshot('footer-desktop.png', {
      maxDiffPixels: 50,
    });
  });
});

test.describe('Visual Regression - Responsive Breakpoints', () => {
  
  test('Navigation switches between mobile and desktop at lg breakpoint', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile navigation (< 1024px)
    await page.setViewportSize({ width: 1023, height: 800 });
    
    const mobileToggle = page.locator('.mobile-menu-toggle');
    await expect(mobileToggle).toBeVisible();
    
    await expect(mobileToggle).toHaveScreenshot('nav-mobile-toggle.png', {
      maxDiffPixels: 20,
    });
    
    // Test desktop navigation (>= 1024px)
    await page.setViewportSize({ width: 1024, height: 800 });
    
    const desktopNav = page.locator('.desktop-nav');
    await expect(desktopNav).toBeVisible();
    
    await expect(desktopNav).toHaveScreenshot('nav-desktop.png', {
      maxDiffPixels: 20,
    });
  });
  
  test('Grid layouts adjust correctly at md breakpoint (768px)', async ({ page }) => {
    await page.goto('/');
    
    // Below md breakpoint - should be 1 column
    await page.setViewportSize({ width: 767, height: 1000 });
    
    const programsGrid767 = page.locator('.programs-grid').first();
    await programsGrid767.scrollIntoViewIfNeeded();
    await expect(programsGrid767).toBeVisible();
    
    await expect(programsGrid767).toHaveScreenshot('programs-grid-767px.png', {
      maxDiffPixels: 100,
    });
    
    // At md breakpoint - should be 2 columns
    await page.setViewportSize({ width: 768, height: 1000 });
    
    const programsGrid768 = page.locator('.programs-grid').first();
    await programsGrid768.scrollIntoViewIfNeeded();
    await expect(programsGrid768).toBeVisible();
    
    await expect(programsGrid768).toHaveScreenshot('programs-grid-768px.png', {
      maxDiffPixels: 100,
    });
  });
});
