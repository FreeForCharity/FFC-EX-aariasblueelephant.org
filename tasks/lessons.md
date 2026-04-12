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
