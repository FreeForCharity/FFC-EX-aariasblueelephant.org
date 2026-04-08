# High-Performance Web Loading: The "Fetch-on-Demand" Strategy

This document outlines the architectural patterns and optimization strategies used to eliminate bandwidth overages and achieve near-instantaneous load times. These techniques are generic and can be applied to any data-driven web application.

## 1. Selective Metadata Fetching
The most common cause of slow initial loads is fetching too much data at once.

- **The Problem**: Fetching an entire database row (including full-resolution images or large JSON blobs) when only the title and date are needed for a list.
- **The Solution**: Explicitly select only text-based metadata for initial renders.
- **Generic Pattern**:
  ```javascript
  // BAD: Fetching everything
  const { data } = await supabase.from('items').select('*');

  // GOOD: Fetching only what the view requires
  const { data } = await supabase.from('items').select('id, name, date, slug');
  ```

## 2. "Fetch-on-Demand" Asset Loading
De-prioritize heavy assets (images, videos, attachments) so they don't block the main thread or blow through bandwidth on initial page load.

- **The Strategy**: Render a lightweight shell for every item in a list, then use the **Intersection Observer API** to trigger a targeted fetch for the heavy asset only when the item scrolls into view.
- **Benefits**:
    - Reduces egress bandwidth by up to 95%.
    - Faster "Time to Interactive" (TTI).
    - Prevents wasting resources on images the user never scrolls to.

## 3. Intelligent State Management
Separate your application state into **Metadata** (fast/light) and **Visuals** (slow/heavy).

- **Implementation**:
    - **Metadata Layer**: Fetch all necessary search/filter information on boot (~100-200kb total).
    - **Visual Layer**: Fetch full-resolution assets individually and cache them in local state.
- **Result**: Navigating between "Upcoming" and "Past" tabs becomes instant because the metadata is already in memory; only the images "pop-in" as needed.

## 4. Deterministic Random Fallbacks
A missing image should never result in a broken UI or a "Loading..." spinner that never goes away.

- **The Hack**: Use a seed-based (deterministic) selection for stock images.
- **Why?**: If you use a truly random choice, images will flicker and change every time the user refreshes. By hashing the ID of the item to pick a stock image, the site remains visually stable and "penned" to that item.
  ```typescript
  const getStockFallback = (seedId: string) => {
    const hash = seedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return STOCK_IMAGES[hash % STOCK_IMAGES.length];
  };
  ```

## 5. UI/UX "Optical Speed" Tricks
Even when loading takes time, you can make the site *feel* faster:

- **Staged Fades**: Use staggered entrance animations (0.1s delay between items) to give the eye time to track movements.
- **Pulse Skeletons**: Use animated background pulses (`animate-pulse`) during fetching to signal that data is coming.
- **LCP Prioritization**: Manually set the first 1-2 images in a list to `loading="eager"` or `priority` to improve Core Web Vitals (Largest Contentful Paint).

## Summary Checklist
1. [ ] Are we selecting specific columns instead of `*`?
2. [ ] Are images lazy-loaded only when visible?
3. [ ] If an image fails or is missing, is there a stable fallback?
4. [ ] Are we caching metadata locally to prevent repeat DB hits?
5. [ ] Is there a loading state that prevents layout shift?
