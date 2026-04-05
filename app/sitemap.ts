import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aariasblueelephant.org';
  
  const staticRoutes = [
    '',
    '/about',
    '/events',
    '/volunteer',
    '/donate',
    '/resources',
    '/resources/understanding-autism',
    '/resources/interventions',
    '/resources/screening',
    '/wheel',
    '/privacy',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...staticRoutes];
}
