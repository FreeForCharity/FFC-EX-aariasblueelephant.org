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
