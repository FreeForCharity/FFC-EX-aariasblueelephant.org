/**
 * Free For Charity - Main JavaScript
 * Pure vanilla JavaScript for all interactive functionality
 */

// ===========================
// Utility Functions
// ===========================

/**
 * Set a cookie
 */
function setCookie(name, value, days) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  const secure = window.location.protocol === 'https:' ? ';Secure' : ''
  document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax' + secure
}

/**
 * Get a cookie
 */
function getCookie(name) {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length)
    }
  }
  return null
}

/**
 * Delete a cookie
 */
function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;'
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ===========================
// Header / Navigation
// ===========================

function initHeader() {
  const header = document.getElementById('header')
  const mobileMenuToggle = document.getElementById('mobileMenuToggle')
  const mobileMenu = document.getElementById('mobileMenu')
  const mobileMenuClose = document.getElementById('mobileMenuClose')
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay')
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link')
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link')

  // Sticky header on scroll
  const handleScroll = debounce(() => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled')
    } else {
      header.classList.remove('scrolled')
    }

    // Update active nav link based on scroll position
    updateActiveNavLink()
  }, 50)

  window.addEventListener('scroll', handleScroll)

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active')
      document.body.style.overflow = 'hidden'
    })
  }

  // Close mobile menu
  function closeMobileMenu() {
    mobileMenu.classList.remove('active')
    document.body.style.overflow = ''
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu)
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu)
  }

  // Close menu when clicking a nav link
  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu()
    })
  })

  // Update active nav link based on scroll position
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]')
    const scrollPosition = window.scrollY + 100

    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute('id')

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active')
          if (link.getAttribute('href') === `/#${sectionId}`) {
            link.classList.add('active')
          }
        })
      }
    })
  }

  // Smooth scroll for anchor links
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('/#')) {
        e.preventDefault()
        const targetId = href.substring(2)
        const targetSection = document.getElementById(targetId)
        if (targetSection) {
          const headerHeight = header.offsetHeight
          const targetPosition = targetSection.offsetTop - headerHeight
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          })
        }
      }
    })
  })
}

// ===========================
// Animated Numbers (Results Section)
// ===========================

function initAnimatedNumbers() {
  const resultNumbers = document.querySelectorAll('.result-number')
  let animated = false

  function animateNumber(element) {
    const target = parseInt(element.getAttribute('data-target'))
    const duration = 2000 // 2 seconds
    const step = target / (duration / 16) // 60fps
    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }

      // Format number with commas for large numbers
      if (target >= 1000) {
        element.textContent = '$' + Math.floor(current).toLocaleString()
      } else {
        element.textContent = Math.floor(current).toString()
      }
    }, 16)
  }

  function checkScroll() {
    if (animated) return

    const resultsSection = document.getElementById('results')
    if (!resultsSection) return

    const rect = resultsSection.getBoundingClientRect()
    const windowHeight = window.innerHeight

    if (rect.top < windowHeight * 0.75) {
      animated = true
      resultNumbers.forEach((element) => {
        animateNumber(element)
      })
    }
  }

  window.addEventListener('scroll', debounce(checkScroll, 100))
  checkScroll() // Check on load
}

// ===========================
// FAQ Accordion
// ===========================

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item')

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question')

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active')

      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('active')
        }
      })

      // Toggle current item
      if (isActive) {
        item.classList.remove('active')
      } else {
        item.classList.add('active')
      }
    })
  })
}

// ===========================
// Cookie Consent Management
// ===========================

const COOKIE_CONSENT_NAME = 'ffc_cookie_consent'
const COOKIE_PREFERENCES_NAME = 'ffc_cookie_preferences'

function initCookieConsent() {
  const cookieConsent = document.getElementById('cookieConsent')
  const cookiePreferences = document.getElementById('cookiePreferences')
  const acceptAllBtn = document.getElementById('cookieAcceptAll')
  const rejectAllBtn = document.getElementById('cookieRejectAll')
  const customizeBtn = document.getElementById('cookieCustomize')
  const savePreferencesBtn = document.getElementById('cookieSavePreferences')
  const cancelPreferencesBtn = document.getElementById('cookieCancelPreferences')
  const modalCloseBtn = document.getElementById('cookieModalClose')

  // Checkboxes
  const analyticsCheckbox = document.getElementById('cookieAnalytics')
  const marketingCheckbox = document.getElementById('cookieMarketing')

  // Track saved preferences for comparison
  let savedPreferences = null

  // Check if consent has been given
  const consent = getCookie(COOKIE_CONSENT_NAME)
  if (!consent) {
    // Show cookie consent banner
    cookieConsent.classList.add('show')
  } else {
    // Load saved preferences and apply them
    savedPreferences = loadPreferences()
    loadAndApplyPreferences()
  }

  // Accept all cookies
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', () => {
      const newPreferences = {
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true,
      }
      savePreferences(newPreferences, savedPreferences)
      savedPreferences = newPreferences
      cookieConsent.classList.remove('show')
      loadAnalyticsScripts()
      loadMarketingScripts()
    })
  }

  // Reject all cookies (except necessary and functional)
  if (rejectAllBtn) {
    rejectAllBtn.addEventListener('click', () => {
      const newPreferences = {
        necessary: true,
        functional: true,
        analytics: false,
        marketing: false,
      }
      savePreferences(newPreferences, savedPreferences)
      savedPreferences = newPreferences
      cookieConsent.classList.remove('show')
    })
  }

  // Show customization modal
  if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
      cookieConsent.classList.remove('show')
      showPreferencesModal()
    })
  }

  // Save custom preferences
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', () => {
      const newPreferences = {
        necessary: true,
        functional: true,
        analytics: analyticsCheckbox.checked,
        marketing: marketingCheckbox.checked,
      }
      savePreferences(newPreferences, savedPreferences)
      savedPreferences = newPreferences
      cookiePreferences.classList.remove('show')

      if (newPreferences.analytics) {
        loadAnalyticsScripts()
      }
      if (newPreferences.marketing) {
        loadMarketingScripts()
      }
    })
  }

  // Cancel preferences
  if (cancelPreferencesBtn) {
    cancelPreferencesBtn.addEventListener('click', () => {
      cookiePreferences.classList.remove('show')
      cookieConsent.classList.add('show')
    })
  }

  // Close modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      cookiePreferences.classList.remove('show')
      cookieConsent.classList.add('show')
    })
  }

  // Click outside modal to close
  if (cookiePreferences) {
    cookiePreferences.addEventListener('click', (e) => {
      // Only close if clicking the overlay itself, not the modal content
      if (e.target === cookiePreferences) {
        cookiePreferences.classList.remove('show')
        cookieConsent.classList.add('show')
      }
    })
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cookiePreferences.classList.contains('show')) {
      cookiePreferences.classList.remove('show')
      cookieConsent.classList.add('show')
    }
  })

  // Make openCookiePreferences available globally
  window.openCookiePreferences = showPreferencesModal
}

function showPreferencesModal() {
  const cookiePreferences = document.getElementById('cookiePreferences')
  const analyticsCheckbox = document.getElementById('cookieAnalytics')
  const marketingCheckbox = document.getElementById('cookieMarketing')

  // Load current preferences
  const preferences = loadPreferences()
  if (preferences) {
    analyticsCheckbox.checked = preferences.analytics
    marketingCheckbox.checked = preferences.marketing
  }

  cookiePreferences.classList.add('show')
}

function savePreferences(preferences, previousPreferences) {
  setCookie(COOKIE_CONSENT_NAME, 'true', 365)
  setCookie(COOKIE_PREFERENCES_NAME, JSON.stringify(preferences), 365)

  // Check if consent was withdrawn and delete cookies if needed
  if (previousPreferences) {
    if (
      (previousPreferences.analytics && !preferences.analytics) ||
      (previousPreferences.marketing && !preferences.marketing)
    ) {
      deleteAnalyticsCookies()
    }
  }

  // Push to dataLayer if available
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'consent_update',
      functional_consent: preferences.functional ? 'granted' : 'denied',
      analytics_consent: preferences.analytics ? 'granted' : 'denied',
      marketing_consent: preferences.marketing ? 'granted' : 'denied',
    })
  }
}

function loadPreferences() {
  const preferencesStr = getCookie(COOKIE_PREFERENCES_NAME)
  if (preferencesStr) {
    try {
      return JSON.parse(preferencesStr)
    } catch (e) {
      console.error('Error parsing cookie preferences:', e)
      return null
    }
  }
  return null
}

function loadAndApplyPreferences() {
  const preferences = loadPreferences()
  if (preferences) {
    if (preferences.analytics) {
      loadAnalyticsScripts()
    }
    if (preferences.marketing) {
      loadMarketingScripts()
    }
  }
}

function deleteAnalyticsCookies() {
  // List of static cookie names to delete
  const cookiesToDelete = ['_ga', '_gid', '_fbp', 'fr', '_clck', '_clsk']

  // Delete static cookies
  cookiesToDelete.forEach((name) => {
    // Delete for current domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    // Also try to delete with domain specification
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
  })

  // Dynamically delete all cookies matching _ga_* (e.g., _ga_G-XXXXXXXXXX)
  document.cookie.split(';').forEach((cookie) => {
    const cookieName = cookie.split('=')[0].trim()
    if (cookieName.startsWith('_ga_')) {
      // Delete for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      // Also try to delete with domain specification
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
    }
  })
}

function loadAnalyticsScripts() {
  // Google Analytics
  const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Replace with actual ID

  if (!document.querySelector('script[src*="googletagmanager.com/gtag"]')) {
    const gaScript = document.createElement('script')
    gaScript.async = true
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(gaScript)

    const gaConfigScript = document.createElement('script')
    const secure = window.location.protocol === 'https:' ? ';Secure' : ''
    gaConfigScript.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=Lax${secure}'
            });
        `
    document.head.appendChild(gaConfigScript)
  }

  // Microsoft Clarity
  loadMicrosoftClarity()
}

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

function loadMarketingScripts() {
  // Meta Pixel would be loaded here
  const META_PIXEL_ID = 'XXXXXXXXXXXXXXX' // Replace with actual ID

  if (!document.querySelector('script[src*="fbevents.js"]')) {
    const fbScript = document.createElement('script')
    fbScript.textContent = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
        `
    document.head.appendChild(fbScript)

    const fbNoScript = document.createElement('noscript')
    fbNoScript.innerHTML = `<img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"/>`
    document.body.appendChild(fbNoScript)
  }
}

// ===========================
// Footer Year Update
// ===========================

function updateFooterYear() {
  const yearElement = document.getElementById('currentYear')
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear()
  }
}

// ===========================
// Initialize All Components
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  initHeader()
  initAnimatedNumbers()
  initFAQ()
  initCookieConsent()
  updateFooterYear()

  console.log('Free For Charity - All components initialized')
})

// ===========================
// Testimonials Carousel
// ===========================

function initTestimonials() {
  const testimonialCards = document.querySelectorAll('.testimonial-card')
  const prevBtn = document.querySelector('.testimonial-prev')
  const nextBtn = document.querySelector('.testimonial-next')
  const dots = document.querySelectorAll('.testimonial-dot')

  if (!testimonialCards.length) return

  let currentIndex = 0
  const totalTestimonials = testimonialCards.length

  // Auto-advance timer
  let autoAdvanceTimer

  function showTestimonial(index) {
    // Hide all testimonials
    testimonialCards.forEach((card) => card.classList.remove('active'))
    dots.forEach((dot) => dot.classList.remove('active'))

    // Show current testimonial
    testimonialCards[index].classList.add('active')
    dots[index].classList.add('active')

    // Update arrow states
    if (prevBtn) prevBtn.disabled = index === 0
    if (nextBtn) nextBtn.disabled = index === totalTestimonials - 1

    currentIndex = index
  }

  function nextTestimonial() {
    const nextIndex = (currentIndex + 1) % totalTestimonials
    showTestimonial(nextIndex)
    resetAutoAdvance()
  }

  function prevTestimonial() {
    const prevIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials
    showTestimonial(prevIndex)
    resetAutoAdvance()
  }

  function goToTestimonial(index) {
    showTestimonial(index)
    resetAutoAdvance()
  }

  function startAutoAdvance() {
    autoAdvanceTimer = setInterval(() => {
      nextTestimonial()
    }, 5000) // Auto-advance every 5 seconds
  }

  function stopAutoAdvance() {
    if (autoAdvanceTimer) {
      clearInterval(autoAdvanceTimer)
    }
  }

  function resetAutoAdvance() {
    stopAutoAdvance()
    startAutoAdvance()
  }

  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', prevTestimonial)
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextTestimonial)
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToTestimonial(index))
  })

  // Pause auto-advance on hover
  const testimonialsWrapper = document.querySelector('.testimonials-wrapper')
  if (testimonialsWrapper) {
    testimonialsWrapper.addEventListener('mouseenter', stopAutoAdvance)
    testimonialsWrapper.addEventListener('mouseleave', startAutoAdvance)
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.testimonials-section:hover')) {
      if (e.key === 'ArrowLeft') {
        prevTestimonial()
      } else if (e.key === 'ArrowRight') {
        nextTestimonial()
      }
    }
  })

  // Initialize
  showTestimonial(0)
  startAutoAdvance()

  console.log('Testimonials carousel initialized')
}

// Initialize testimonials when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonials)
} else {
  initTestimonials()
}

// ===========================
// Export functions for global access
// ===========================

window.ffc = {
  openCookiePreferences: showPreferencesModal,
  setCookie,
  getCookie,
  deleteCookie,
}
