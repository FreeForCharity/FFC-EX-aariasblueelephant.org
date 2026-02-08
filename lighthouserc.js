module.exports = {
  ci: {
    collect: {
      // Serve the static site for Lighthouse to test
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Accepting connections',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:8000/'],
      numberOfRuns: 3, // Run Lighthouse 3 times and take median
      settings: {
        preset: 'desktop',
        // Only test categories that matter for static HTML sites
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // Other important metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
