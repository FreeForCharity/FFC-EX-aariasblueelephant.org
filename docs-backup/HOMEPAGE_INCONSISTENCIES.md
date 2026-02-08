# Homepage Inconsistencies: React vs HTML

## Executive Summary

This document compares the Next.js React homepage (`src/app/home-page/index.tsx`) with the HTML static homepage (`html-site/index.html`) to identify inconsistencies between the two versions.

**Date**: December 24, 2025  
**Analysis Focus**: All homepage sections except the Team section (being addressed in PR #13)

## Section-by-Section Analysis

### ✅ 1. Hero Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Hero/index.tsx`
- HTML: Lines 162-197 of `html-site/index.html`

### ✅ 2. Mission Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Mission/index.tsx`
- HTML: Lines 198-230 of `html-site/index.html`

**Verification**: Both versions include:

- Same title text
- Same mission statement
- Same video embed (https://ffcsites.org/videos/mission-video.mp4)

---

### ❌ 3. Results/Impact Section

**Status**: **MAJOR INCONSISTENCY FOUND**  
**Location**:

- React: `src/components/home-page/Results-2023/index.tsx`
- HTML: Lines 231-252 of `html-site/index.html`

**Differences**:

| Aspect              | React Version                                                  | HTML Version                               |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| **Title**           | "Results - 2023"                                               | "2023 Impact Results"                      |
| **Number of Cards** | 4 cards                                                        | 3 cards                                    |
| **Card 1**          | 221 - "Organizational partners"                                | 50 - "Nonprofits Supported"                |
| **Card 2**          | 3 - "Total volunteers"                                         | $150,000 - "Value Delivered"               |
| **Card 3**          | 221 - "Organizations accessing technical assistance offerings" | 25 - "Active Volunteers"                   |
| **Card 4**          | 25 - "Volunteer hours contributed to the organization"         | _(not present)_                            |
| **Animation**       | No animation                                                   | Counter animation (data-target attributes) |

**Impact**: Critical - Different data being presented to users on different platforms.

**Recommendation**: Determine which dataset is accurate and update both versions to match.

---

### ✅ 4. Testimonials Section

**Status**: Consistent  
**Location**:

- React: `src/components/home/Testimonials/index.tsx`
- HTML: Lines 253-394 of `html-site/index.html`

### ✅ 5. Volunteer Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Volunteer-with-Us/index.tsx`
- HTML: Lines 395-429 of `html-site/index.html`

### ✅ 6. Events Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Events/index.tsx`
- HTML: Lines 430-464 of `html-site/index.html`

**Verification**: Both versions include:

- Same title: "Upcoming Events"
- Same description
- Same SociableKit iframe (ID: 25631700)
- Same Facebook link

---

### ❌ 7. Support/Donate Section

**Status**: **MAJOR INCONSISTENCY FOUND**  
**Location**:

- React: `src/components/home-page/SupportFreeForCharity/index.tsx`
- HTML: Lines 465-488 of `html-site/index.html`

**Differences**:

| Aspect            | React Version                                                                                                                 | HTML Version                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Layout**        | 2-column layout with image                                                                                                    | Simple single column                                                                   |
| **Description**   | "By donating you help drive our mission and allow us to support more charities with our Domain, Website, and other services." | "Your donation helps us provide free services to nonprofits across the country."       |
| **Image**         | Includes `/Images/support-free-for-charity.webp` (flipped pointing hands)                                                     | No image                                                                               |
| **Zeffy URL**     | `https://www.zeffy.com/embed/donation-form/free-for-charity-endowment-fund`                                                   | `https://www.zeffy.com/en-US/embed/donation-form/7d8b3e8c-4f1a-4d9e-8c5b-6e7f8a9b0c1d` |
| **Iframe Height** | 600px                                                                                                                         | 800px                                                                                  |
| **Styling**       | Rounded box shadow form container                                                                                             | Simple full-width iframe                                                               |

**Impact**: Critical - Different donation forms may be linked to different campaigns or accounts.

**Recommendation**:

1. Verify which Zeffy form URL is correct
2. Update HTML version to match React's 2-column layout with image
3. Ensure both point to the same donation endpoint

---

### ✅ 8. Endowment Features Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Endowment-Features/index.tsx`
- HTML: Lines 489-566 of `html-site/index.html`

**Verification**: Both versions include the same 4 features:

1. Sustainable Funding
2. Long-Term Impact
3. Goal of $1,000,000
4. Be a Champion for Change

### ✅ 9. Our Programs Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/Our-Programs/index.tsx`
- HTML: Lines 567-606 of `html-site/index.html`

### ✅ 10. FAQ Section

**Status**: Consistent  
**Location**:

- React: `src/components/home-page/FrequentlyAskedQuestions/index.tsx`
- HTML: Lines 607-670 of `html-site/index.html`

### 🔄 11. Team Section

**Status**: Being addressed in PR #13  
**Location**:

- React: `src/components/home-page/TheFreeForCharityTeam/index.tsx`
- HTML: Lines 671+ of `html-site/index.html`

**Note**: Not analyzed as this is already being fixed in PR #13

---

## Summary of Findings

### Critical Issues (2)

1. **Results Section**: Different data and card counts
2. **Donate Section**: Different Zeffy URLs and layouts

### Consistent Sections (9)

1. Hero ✅
2. Mission ✅
3. Testimonials ✅
4. Volunteer ✅
5. Events ✅
6. Endowment Features ✅
7. Our Programs ✅
8. FAQ ✅
9. Team (in progress via PR #13) 🔄

## Recommendations

### Priority 1: Fix Results Section

- [ ] Verify correct 2023 data with stakeholders
- [ ] Update both versions to use the same data
- [ ] Decide if animation should be added to React version

### Priority 2: Fix Donate Section

- [ ] Verify which Zeffy form URL is correct
- [ ] Update HTML to match React's richer layout with image
- [ ] Ensure consistent user experience across platforms

### Priority 3: Documentation

- [ ] Document the correct data sources for the Results section
- [ ] Document which Zeffy form should be used
- [ ] Update any conversion documentation to note these inconsistencies were found

## Testing Checklist

After fixes are applied:

- [ ] Verify Results section shows correct data on both versions
- [ ] Verify Donate section uses same Zeffy form URL
- [ ] Verify Donate section has consistent layout
- [ ] Test donation flow on both versions
- [ ] Visual regression testing for all updated sections

---

**Generated by**: GitHub Copilot  
**Date**: December 24, 2025  
**Related PR**: #15
