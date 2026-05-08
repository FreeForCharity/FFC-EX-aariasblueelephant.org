// High-quality Blue Elephant themed fallback images if fetching fails
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop", // Children playing
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=2038&auto=format&fit=crop", // Inclusive playground
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2070&auto=format&fit=crop", // Community support
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1972&auto=format&fit=crop"  // Smiling child
];

export async function fetchGooglePhotosAlbum(albumUrl: string): Promise<string[]> {
  if (!albumUrl) return FALLBACK_IMAGES;
  
  try {
    // We use allorigins.win as a free CORS proxy
    // We append a cache-buster to ensure we get the latest content
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(albumUrl)}&disableCache=true`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch album');
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) return FALLBACK_IMAGES;

    // Google Photos stores image data inside script tags.
    const regex = /"(https:\/\/[a-z0-9]+\.googleusercontent\.com\/[a-zA-Z0-9\-_]+)"/g;
    const matches = Array.from(html.matchAll(regex));
    const rawUrls = [...new Set(matches.map((m: any) => m[1]))] as string[];
    
    const validPhotoUrls = rawUrls
      .filter(url => {
        const isProfileIcon = url.includes('placeholder') || url.includes('profile');
        // Real photos usually have long IDs. We lowered the threshold slightly to be safer.
        return url.length > 70 && !isProfileIcon;
      })
      .map(url => `${url}=w1920-h1080-no`);

    if (validPhotoUrls.length === 0) {
      console.warn("No valid photos found in album, using fallbacks");
      return FALLBACK_IMAGES;
    }

    return validPhotoUrls.slice(0, 30);

  } catch (error) {
    console.error("Error fetching Google Photos:", error);
    return FALLBACK_IMAGES;
  }
}
