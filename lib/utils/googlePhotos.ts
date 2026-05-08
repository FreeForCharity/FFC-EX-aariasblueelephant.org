/**
 * Utility to extract direct image URLs from a public Google Photos Album link.
 * Note: This uses a CORS proxy because Google Photos blocks cross-origin requests.
 */

export async function fetchGooglePhotosAlbum(albumUrl: string): Promise<string[]> {
  if (!albumUrl) return [];
  
  try {
    // We use allorigins.win as a free CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(albumUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch album');
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) return [];

    // Google Photos stores image data inside script tags.
    // We look for high-quality image URLs starting with lh3.googleusercontent.com
    // We also look for other CDN patterns like photos-fife.googleusercontent.com
    const regex = /"(https:\/\/[a-z0-9]+\.googleusercontent\.com\/[a-zA-Z0-9\-_]+)"/g;
    
    const matches = Array.from(html.matchAll(regex));
    
    // We get a lot of duplicates and small UI icons. 
    const rawUrls = [...new Set(matches.map((m: any) => m[1]))] as string[];
    
    // Filtering logic:
    // 1. URLs must be long (real photos have long IDs)
    // 2. Filter out common UI assets or profile icons
    const validPhotoUrls = rawUrls
      .filter(url => {
        const isProfileIcon = url.includes('placeholder') || url.includes('profile');
        return url.length > 80 && !isProfileIcon;
      })
      .map(url => `${url}=w1920-h1080-no`);

    // Only take the first 25-30 to keep it performant
    return validPhotoUrls.slice(0, 30);

  } catch (error) {
    console.error("Error fetching Google Photos:", error);
    return [];
  }
}
