import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/login', '/signup', '/permission-denied'],
      },
    ],
    sitemap: 'https://aariasblueelephant.org/sitemap.xml',
  };
}
