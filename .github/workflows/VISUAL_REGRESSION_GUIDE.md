# Visual Regression Testing Implementation

## Overview

This document describes the visual regression testing implementation added to the CI/CD pipeline to ensure homepage changes don't break rendering for users.

## Design Goals

1. **Fast Execution**: Keep CI runtime under 10 minutes total
2. **High Value**: Focus on critical user-facing sections
3. **Reliable**: Avoid false positives with appropriate diff tolerance
4. **Streamlined**: Test only what matters for user experience

## Test Strategy

### Scope: Critical Homepage Sections Only

Instead of full-page screenshots (slow, brittle), we test specific critical sections:

- **Hero Section**: First thing users see (mobile + desktop)
- **Navigation Header**: Primary site navigation (mobile + desktop)
- **Programs Grid**: Main content layout (desktop + responsive breakpoints)
- **Footer**: Contact info and links (desktop)
- **Responsive Breakpoints**: Navigation and grid column changes

### Viewports Tested

- **Mobile**: 375x667 (iPhone SE - most common mobile viewport)
- **Tablet**: 768x1024 (iPad - most common tablet viewport)
- **Desktop**: 1920x1080 (FHD - most common desktop resolution)

## Implementation Details

### Test File: `tests/visual-regression.spec.ts`

**10 Visual Regression Tests:**
1. Hero Section - Mobile
2. Hero Section - Desktop
3. Navigation Header - Mobile
4. Navigation Header - Desktop
5. Programs Grid - Desktop
6. Footer - Desktop
7. Navigation Toggle at Breakpoints
8. Desktop Navigation Visibility
9. Programs Grid - Below md breakpoint (767px)
10. Programs Grid - At md breakpoint (768px)

### Screenshot Strategy

```typescript
await expect(element).toHaveScreenshot('name.png', {
  maxDiffPixels: 100, // Allow minor rendering differences
});
```

**Diff Tolerance:**
- Header/Footer/Nav: 50 pixels (mostly static)
- Hero/Programs: 100 pixels (may have dynamic content)

This prevents false positives from minor anti-aliasing or font rendering differences.

### Baseline Screenshots

Location: `tests/visual-regression.spec.ts-snapshots/`

**10 Baseline Images:**
- `hero-mobile-chromium-linux.png`
- `hero-desktop-chromium-linux.png`
- `header-mobile-chromium-linux.png`
- `header-desktop-chromium-linux.png`
- `programs-grid-desktop-chromium-linux.png`
- `footer-desktop-chromium-linux.png`
- `nav-mobile-toggle-chromium-linux.png`
- `nav-desktop-chromium-linux.png`
- `programs-grid-767px-chromium-linux.png`
- `programs-grid-768px-chromium-linux.png`

## CI/CD Integration

### New Workflow: `.github/workflows/test.yml`

**Triggers:**
- Push to main
- Pull requests to main

**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Install Playwright Chromium browser
5. Run all Playwright tests (including visual regression)
6. Upload test reports on failure

**Duration:** ~3-5 minutes

### Updated Deploy Workflow

Deploy now waits for BOTH:
- Test & Visual Regression workflow
- CodeQL Advanced workflow

```yaml
workflow_run:
  workflows: ["Test & Visual Regression", "CodeQL Advanced"]
  types: [completed]
  branches: ['main']
```

## Execution Flow

```
Push to Main
    │
    ├─> Test & Visual Regression (3-5 min) ─┐
    │                                        │
    └─> CodeQL Advanced (1-2 min)           ─┤
                                             │
                                             ▼
                                    Both Succeeded?
                                             │
                                    ┌────────┴────────┐
                                    │                 │
                                   YES               NO
                                    │                 │
                                    ▼                 ▼
                                 Deploy          Blocked
```

**Total CI Time:** ~4-6 minutes (parallel execution)

## Performance Metrics

### Test Execution Time
- **Visual Regression Tests Only**: ~9 seconds
- **All Playwright Tests**: ~30-40 seconds
- **Full CI Pipeline**: ~4-6 minutes (including CodeQL)

### Comparison to Alternatives
- **Full Page Screenshots**: 30-60 seconds per test
- **Section Screenshots**: 1-2 seconds per test ✅
- **Our Approach**: 10 tests in ~9 seconds ✅

## What Gets Caught

### Visual Breaking Changes Detected:
✅ Hero image not loading
✅ Navigation menu rendering incorrectly
✅ Grid layouts breaking (wrong column count)
✅ Responsive breakpoints not working
✅ Footer elements misaligned
✅ Logo/branding changes

### False Positives Avoided:
❌ Minor font anti-aliasing differences
❌ Small color rendering variations
❌ Dynamic content changes (with 100px tolerance)
❌ System font differences

## Updating Baselines

When intentional visual changes are made:

```bash
# Update all baselines
npm run test -- visual-regression.spec.ts --update-snapshots

# Update specific test baseline
npm run test -- visual-regression.spec.ts -g "Hero Section - Desktop" --update-snapshots
```

## Troubleshooting

### Test Failing on CI but Passing Locally

**Cause:** Different rendering between environments

**Solution:**
1. Check diff images in CI artifacts
2. If change is acceptable, update baseline in CI
3. Download new baseline and commit

### Test Taking Too Long

**Cause:** Testing too many elements or full pages

**Solution:**
- Focus on critical sections only
- Use element selectors, not full page screenshots
- Test fewer viewport sizes

### Too Many False Positives

**Cause:** maxDiffPixels tolerance too low

**Solution:**
- Increase `maxDiffPixels` for dynamic sections
- Use higher tolerance for content areas
- Use lower tolerance for static UI chrome

## Best Practices

### ✅ DO
- Test critical user-facing sections
- Use appropriate diff tolerance
- Update baselines when making intentional changes
- Keep viewport count minimal (mobile, tablet, desktop)
- Focus on layout and structure, not content

### ❌ DON'T
- Screenshot entire pages (too slow, too brittle)
- Test every viewport size (diminishing returns)
- Use zero diff tolerance (causes false positives)
- Test dynamic content areas without tolerance
- Ignore legitimate test failures

## Future Enhancements

### Potential Improvements:
1. Add tests for other key pages (about, contact)
2. Test dark mode if implemented
3. Add cross-browser testing (Firefox, Safari)
4. Integrate visual regression in PR preview comments
5. Add performance budgets to tests

### Not Recommended:
- Full page screenshots (too slow)
- Pixel-perfect matching (too brittle)
- Testing every breakpoint (diminishing returns)
- Testing content changes (use functional tests)

## Conclusion

The visual regression testing implementation provides:
- **Fast CI**: ~4-6 minutes total
- **High Coverage**: Critical homepage sections
- **Reliable**: Tolerances prevent false positives
- **Valuable**: Catches real UI breaking changes

This ensures homepage changes don't break user experience while keeping CI streamlined and efficient.
