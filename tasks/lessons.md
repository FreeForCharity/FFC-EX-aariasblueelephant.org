# Lessons Learned

## Testimonial & Media Management

### Synchronized Component Views
- **Problem**: Updated the "Summary" version of a card to support rich media but forgot the "Modal" view, leading to broken playback.
- **Pattern**: If a data item (like a testimonial) can be viewed in multiple ways (Card vs Modal), always ensure the media-rendering logic is extracted into a shared utility or consistently applied to all view components.

### Resilient Media Detection
- **Problem**: Initial detection only scanned the "Message" text, ignoring the "Media Link" field.
- **Solution**: Use a utility like `extractMedia` to scan ALL potential URL-carrying fields (content, avatar, media_link) to ensure the best visual is always found.

### Form Flexibility
- **Problem**: Users may want to provide a photo OR a video, or both.
- **Solution**: Mark media fields as (Optional) and allow the system to handle different media types interchangeably.

## Appwrite Migration & Image Resilience

### Resilient Image Loading
- **Problem**: Loading spinners were "stuck" over images because state was tied to network fetch rather than browser render.
- **Solution**: Always use an `onLoad` handler on the native `img` tag to manage the final `isLoading` state. This ensures the spinner disappears the millisecond the pixel data is visible.

### Truncated Data Validation
- **Problem**: Legacy data from Supabase migrations often contained truncated Base64 strings, causing broken image icons.
- **Solution**: Implement a "Quality Guard" that validates Base64 string length (e.g., > 1000 chars) before attempting to render. If invalid, drop to the stock fallback immediately.

### Instant Fallback UX
- **Problem**: Showing a spinner while fetching "empty" database fields makes the app feel slow.
- **Solution**: Default to showing a high-quality stock photo IMMEDIATELY. Only show a spinner if a valid custom database ID is detected and is actively fetching. This maintains a "premium/instant" feel during navigation.

## Authentication & OAuth

### Race Condition: onAuthStateChange vs checkSession
- **Problem**: `onAuthStateChange` called `getSession()` immediately during setup, which raced with the async `checkSession()` and overwrote the session with `null` before cookies had settled. This caused ProtectedRoute to redirect to `/login` prematurely, creating a login loop.
- **Root Cause**: Two competing session checks. The eager one wins and reports "no session" → `isLoading` becomes false → ProtectedRoute kicks the user out.
- **Solution**: `onAuthStateChange` should ONLY subscribe to real-time events. The initial session check must be the sole responsibility of `checkSession()`. Never have two code paths that both call `handleSession()` during initialization.
- **Rule**: In any auth system, there should be exactly ONE initial session check. All other listeners should only fire for subsequent changes.

### Redundant Redirect Guards
- **Problem**: Both `Dashboard.tsx` and `ProtectedRoute.tsx` had `navigate('/login')` logic. During the session detection window, Dashboard's redirect fired before ProtectedRoute could show the loading state.
- **Solution**: Only ProtectedRoute should handle auth redirects. Remove duplicate guards from page components.

### Return-To Path Persistence
- **Problem**: Users lost their place after OAuth because `returnTo` was only saved in some code paths.
- **Solution**: Save `window.location.pathname` in `loginWithGoogle()` itself, so EVERY login trigger preserves the user's current page. Strip the GitHub Pages base path before saving.
