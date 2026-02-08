# Cookie Management System Implementation

## Overview

This document describes the advanced cookie management system implemented in the HTML static site, matching the functionality from the Next.js primary template.

## Features Implemented

### 1. Microsoft Clarity Analytics Support ✅

**Location**: `html-site/js/main.js`

Added `loadMicrosoftClarity()` function that:

- Checks if Microsoft Clarity script is already loaded
- Dynamically injects the Clarity tracking code
- Uses placeholder ID that can be replaced with actual project ID

```javascript
function loadMicrosoftClarity() {
  const CLARITY_PROJECT_ID = 'XXXXXXXXXX' // Replace with actual ID
  if (!document.querySelector('script[src*="clarity.ms"]')) {
const clarityScript = document.createElement('script')
clarityScript.textContent = `
(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
`
document.head.appendChild(clarityScript)
  }
}
```

Microsoft Clarity is now automatically loaded when analytics cookies are accepted.

### 2. Cookie Deletion When Consent Withdrawn ✅

**Location**: `html-site/js/main.js`

Added `deleteAnalyticsCookies()` function that:

- Deletes common analytics cookies: `_ga`, `_gid`, `_fbp`, `fr`, `_clck`, `_clsk`
- Dynamically finds and deletes all `_ga_*` cookies (Google Analytics session cookies)
- Attempts deletion for both current domain and with domain specification

```javascript
function deleteAnalyticsCookies() {
  const cookiesToDelete = ['_ga', '_gid', '_fbp', 'fr', '_clck', '_clsk']
  cookiesToDelete.forEach((name) => {
document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
  })
  // Also delete dynamically created _ga_* cookies
  document.cookie.split(';').forEach((cookie) => {
const cookieName = cookie.split('=')[0].trim()
if (cookieName.startsWith('_ga_')) {
document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
}
  })
}
```

This function is called when:

- User clicks "Decline All"
- User changes preferences from accepting to declining analytics/marketing

### 3. Enhanced Cookie Banner ✅

**Location**: `html-site/index.html`

Updated banner includes:

- **Heading**: "We Value Your Privacy"
- **Detailed description**: Explains cookie usage clearly
- **Policy links**: Direct links to Privacy Policy and Cookie Policy
- **ARIA attributes**: `role="region"` and `aria-label="Cookie consent notice"`
- **Better button order**: Decline All → Customize → Accept All

### 4. Improved Cookie Preferences Modal ✅

**Location**: `html-site/index.html`

Enhanced modal with:

- **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Detailed descriptions** for each cookie category
- **Service provider information**:
  - Necessary: Essential website functions
  - Functional: Zeffy (Donation Processing), Microsoft Forms
  - Analytics: Google Analytics, Microsoft Clarity
  - Marketing: Meta Pixel (Facebook)
- **Toggle switches** instead of checkboxes for better UX
- **Always Active** indicators for necessary and functional cookies

### 5. Modern Styling ✅

**Location**: `html-site/css/styles.css`

Updated styling:

- **Light theme**: White background instead of dark (matches Next.js version)
- **Professional appearance**: Border-top, shadow effects
- **Toggle switches**: Custom styled switches for analytics/marketing
- **Responsive design**: Adapts to mobile and desktop
- **Better spacing**: Improved padding and margins
- **Accessibility**: Focus states for keyboard navigation

### 6. Enhanced JavaScript Functionality ✅

**Location**: `html-site/js/main.js`

Improved functionality:

- **Previous preference tracking**: Detects when consent is withdrawn
- **DataLayer integration**: Uses `consent_update` event (matches Next.js)
- **Modal interactions**:
  - Click outside to close
  - Escape key to close
  - Cancel button to close
- **Error handling**: Try-catch for localStorage operations

## Comparison with Next.js Version

| Feature               | Next.js Version | HTML Version | Status          |
| --------------------- | --------------- | ------------ | --------------- |
| Microsoft Clarity     | ✅              | ✅           | **Implemented** |
| Google Analytics      | ✅              | ✅           | Already had     |
| Meta Pixel (Facebook) | ✅              | ✅           | Already had     |
| Cookie Deletion       | ✅              | ✅           | **Implemented** |
| Toggle Switches       | ✅              | ✅           | **Implemented** |
| Service Provider Info | ✅              | ✅           | **Implemented** |
| Privacy Policy Links  | ✅              | ✅           | **Implemented** |
| ARIA Attributes       | ✅              | ✅           | **Implemented** |
| Light Theme Banner    | ✅              | ✅           | **Implemented** |
| DataLayer Events      | ✅              | ✅           | **Improved**    |
| Modal Close Options   | ✅              | ✅           | **Implemented** |

## Testing Checklist

### Manual Testing

- [x] Cookie banner appears on first visit
- [x] Banner has "We Value Your Privacy" heading
- [x] Privacy Policy and Cookie Policy links present
- [x] All three buttons visible (Decline All, Customize, Accept All)
- [x] Customize opens preferences modal
- [x] Modal has proper ARIA attributes
- [x] Modal shows all four cookie categories
- [x] Necessary and Functional show "Always Active"
- [x] Analytics and Marketing have toggle switches
- [x] Service provider information displayed
- [x] Save Preferences button works
- [x] Cancel button closes modal and shows banner
- [x] Click outside modal closes it
- [x] Escape key closes modal
- [x] Preferences saved to localStorage
- [x] Preferences respected on page reload

### Automated Testing

Playwright tests should verify:

- Banner display and content
- Modal functionality
- Preference persistence
- ARIA attributes for accessibility
- Click and keyboard interactions

## Configuration

To use this cookie management system:

1. **Replace placeholder IDs** in `html-site/js/main.js`:

   ```javascript
   const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Your Google Analytics ID
   const META_PIXEL_ID = 'XXXXXXXXXXXXXXX' // Your Meta Pixel ID
   const CLARITY_PROJECT_ID = 'XXXXXXXXXX' // Your Microsoft Clarity ID
   ```

2. **Update Google Tag Manager** in `html-site/index.html`:

   ```javascript
   // Line 92
   j.src = 'https://www.googletagmanager.com/gtag/js?id=' + i + dl
   ```

3. **Test thoroughly** after adding real IDs to ensure tracking works correctly

## Browser Compatibility

The cookie management system works on:

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Browsers with JavaScript enabled
- ⚠️ Gracefully degrades without JavaScript (no tracking, no banner)

## Privacy Compliance

This implementation helps with:

- ✅ GDPR compliance (EU)
- ✅ CCPA compliance (California)
- ✅ User consent management
- ✅ Cookie preference storage
- ✅ Cookie deletion on consent withdrawal

## Maintenance

When updating:

1. Keep descriptions clear and accurate
2. Update service provider lists if adding new tools
3. Test cookie deletion after changes
4. Verify dataLayer events are tracked
5. Ensure mobile responsiveness maintained

## Support

For issues or questions about the cookie management system:

1. Check browser console for errors
2. Verify localStorage is enabled
3. Test in incognito/private mode
4. Review browser cookie settings
5. Check network tab for script loading

## Summary

The HTML static site now has a complete, advanced cookie management system that matches the functionality of the Next.js primary template. All key features have been implemented:

✅ Microsoft Clarity analytics support
✅ Cookie deletion when consent withdrawn
✅ Enhanced banner with policy links
✅ Detailed preference modal with toggle switches
✅ Modern, accessible styling
✅ Improved JavaScript with better state management

The system is ready for production use once tracking IDs are configured.

