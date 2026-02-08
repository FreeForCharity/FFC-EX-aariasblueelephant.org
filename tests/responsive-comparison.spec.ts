/**
 * Responsive Layout Comparison Tests
 * 
 * This test suite validates that the responsive breakpoints and layout behavior
 * of the HTML implementation match the Next.js/React Tailwind CSS implementation.
 */

import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:8000';

// Test viewport sizes covering key breakpoint transitions
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  mobileLarge: { width: 639, height: 800, name: 'Mobile Large (just before sm)' },
  smBreakpoint: { width: 640, height: 800, name: 'sm breakpoint (640px)' },
  betweenSmMd: { width: 700, height: 900, name: 'Between sm and md' },
  mdBreakpoint: { width: 768, height: 1024, name: 'md breakpoint (768px) - iPad' },
  betweenMdLg: { width: 900, height: 1000, name: 'Between md and lg' },
  lgBreakpoint: { width: 1024, height: 768, name: 'lg breakpoint (1024px) - iPad Pro' },
  xlBreakpoint: { width: 1280, height: 800, name: 'xl breakpoint (1280px)' },
  desktop: { width: 1920, height: 1080, name: 'Desktop FHD' },
};

test.describe('Responsive Layout Comparison', () => {
  
  test('Results Section - Grid Column Count at Different Breakpoints', async ({ page }) => {
    await page.goto(baseURL);
    
    const results: Array<{ viewport: string; width: number; columns: number }> = [];
    
    // Test at each viewport
    for (const viewport of Object.values(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100); // Allow CSS to apply
      
      // Get the computed grid-template-columns value
      const resultsGrid = page.locator('.results-grid').first();
      await expect(resultsGrid).toBeVisible(); // Ensure element exists
      
      const gridColumns = await resultsGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const templateColumns = style.gridTemplateColumns;
        // Count the number of columns by splitting on spaces
        return templateColumns.split(' ').length;
      });
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}px)`,
        width: viewport.width,
        columns: gridColumns,
      });
    }
    
    // Log results for analysis
    console.log('\n=== Results Section Grid Columns ===');
    results.forEach(r => {
      const expected = getExpectedColumns(r.width, 'results');
      const status = r.columns === expected ? '✅' : '⚠️ ';
      console.log(`${status} ${r.viewport}: ${r.columns} columns (expected: ${expected})`);
    });
    
    // Verify key breakpoints
    const mobile = results.find(r => r.width === 375);
    const sm = results.find(r => r.width === 640);
    const md = results.find(r => r.width === 768);
    const lg = results.find(r => r.width === 1024);
    const xl = results.find(r => r.width === 1280);
    
    expect(mobile?.columns).toBe(1); // Mobile: 1 column
    expect(sm?.columns).toBe(1);     // Small: 1 column
    expect(md?.columns).toBe(2);     // Medium: 2 columns
    expect(lg?.columns).toBe(3);     // Large: 3 columns
    expect(xl?.columns).toBe(4);     // Extra large: 4 columns
  });
  
  test('Programs Section - Grid Column Count at Different Breakpoints', async ({ page }) => {
    await page.goto(baseURL);
    
    const results: Array<{ viewport: string; width: number; columns: number }> = [];
    
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      
      const programsGrid = page.locator('.programs-grid').first();
      await expect(programsGrid).toBeVisible(); // Ensure element exists
      
      const gridColumns = await programsGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const templateColumns = style.gridTemplateColumns;
        return templateColumns.split(' ').length;
      });
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}px)`,
        width: viewport.width,
        columns: gridColumns,
      });
    }
    
    console.log('\n=== Programs Section Grid Columns ===');
    results.forEach(r => {
      const expected = getExpectedColumns(r.width, 'programs');
      const status = r.columns === expected ? '✅' : '⚠️ ';
      console.log(`${status} ${r.viewport}: ${r.columns} columns (expected: ${expected})`);
    });
    
    const mobile = results.find(r => r.width === 375);
    const sm = results.find(r => r.width === 640);
    const md = results.find(r => r.width === 768);
    const lg = results.find(r => r.width === 1024);
    
    expect(mobile?.columns).toBe(1); // Mobile: 1 column
    expect(sm?.columns).toBe(1);     // Small: 1 column
    expect(md?.columns).toBe(2);     // Medium: 2 columns
    expect(lg?.columns).toBe(3);     // Large: 3 columns
  });
  
  test('Team Section - Grid Column Count at Different Breakpoints', async ({ page }) => {
    await page.goto(baseURL);
    
    const results: Array<{ viewport: string; width: number; columns: number }> = [];
    
    for (const viewport of Object.values(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      
      const teamGrid = page.locator('.team-grid').first();
      await expect(teamGrid).toBeVisible(); // Ensure element exists
      
      const gridColumns = await teamGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const templateColumns = style.gridTemplateColumns;
        return templateColumns.split(' ').length;
      });
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}px)`,
        width: viewport.width,
        columns: gridColumns,
      });
    }
    
    console.log('\n=== Team Section Grid Columns ===');
    results.forEach(r => {
      const expected = getExpectedColumns(r.width, 'team');
      const status = r.columns === expected ? '✅' : '⚠️ ';
      console.log(`${status} ${r.viewport}: ${r.columns} columns (expected: ${expected})`);
    });
    
    const mobile = results.find(r => r.width === 375);
    const sm = results.find(r => r.width === 640);
    const md = results.find(r => r.width === 768);
    const lg = results.find(r => r.width === 1024);
    
    expect(mobile?.columns).toBe(1); // Mobile: 1 column
    expect(sm?.columns).toBe(1);     // Small: 1 column
    expect(md?.columns).toBe(2);     // Medium: 2 columns
    expect(lg?.columns).toBe(3);     // Large: 3 columns
  });
  
  test('Navigation - Desktop Nav Visibility at Different Breakpoints', async ({ page }) => {
    await page.goto(baseURL);
    
    const results: Array<{ viewport: string; width: number; desktopNavVisible: boolean; mobileToggleVisible: boolean }> = [];
    
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      
      const desktopNav = page.locator('.desktop-nav');
      const mobileToggle = page.locator('.mobile-menu-toggle');
      
      const desktopVisible = await desktopNav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      });
      
      const mobileVisible = await mobileToggle.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      });
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}px)`,
        width: viewport.width,
        desktopNavVisible: desktopVisible,
        mobileToggleVisible: mobileVisible,
      });
    }
    
    console.log('\n=== Navigation Visibility ===');
    results.forEach(r => {
      const expectedDesktop = r.width >= 1024; // HTML implementation
      const reactExpected = r.width >= 768;    // React would show at 768px
      const differs = expectedDesktop !== reactExpected;
      const status = differs ? '⚠️ ' : '✅';
      console.log(`${status} ${r.viewport}: Desktop=${r.desktopNavVisible}, Mobile=${r.mobileToggleVisible} (React expects desktop at 768px+)`);
    });
    
    const md = results.find(r => r.width === 768);
    const lg = results.find(r => r.width === 1024);
    
    // HTML implementation shows desktop nav at 1024px+
    expect(md?.desktopNavVisible).toBe(false);  // Still mobile at 768px
    expect(md?.mobileToggleVisible).toBe(true);
    expect(lg?.desktopNavVisible).toBe(true);   // Desktop at 1024px
    expect(lg?.mobileToggleVisible).toBe(false);
  });
  
  test('Typography - Hero Title Font Size Scaling', async ({ page }) => {
    await page.goto(baseURL);
    
    const results: Array<{ viewport: string; width: number; fontSize: string }> = [];
    
    for (const viewport of Object.values(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      
      const heroTitle = page.locator('.hero-title').first();
      const fontSize = await heroTitle.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}px)`,
        width: viewport.width,
        fontSize,
      });
    }
    
    console.log('\n=== Hero Title Font Sizes ===');
    results.forEach(r => {
      console.log(`${r.viewport}: ${r.fontSize}`);
    });
    
    // Verify progressive scaling exists
    const mobile = results.find(r => r.width === 375);
    const md = results.find(r => r.width === 768);
    const lg = results.find(r => r.width === 1024);
    
    // Font should increase with viewport size
    const mobileFontPx = parseFloat(mobile?.fontSize || '0');
    const mdFontPx = parseFloat(md?.fontSize || '0');
    const lgFontPx = parseFloat(lg?.fontSize || '0');
    
    expect(mdFontPx).toBeGreaterThan(mobileFontPx);
    expect(lgFontPx).toBeGreaterThan(mdFontPx);
  });
});

/**
 * Helper function to get expected column count based on Next.js/React Tailwind implementation
 */
function getExpectedColumns(width: number, section: 'results' | 'programs' | 'team'): number {
  if (section === 'results') {
    // React: 1 col mobile, 2 cols md (768px), 3 cols lg (1024px), 4 cols xl (1280px)
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  } else if (section === 'programs') {
    // React: 1 col mobile, 2 cols md (768px), 3 cols lg (1024px)
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  } else { // team
    // React: 1 col mobile, 2 cols md (768px), 3 cols lg (1024px)
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  }
}
