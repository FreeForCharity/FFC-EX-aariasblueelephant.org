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
    // Specifically, we look for URLs that contain the 'pw' (photos web) marker or standard content markers
    const regex = /"(https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9\-_]+)"/g;
    
    const matches = Array.from(html.matchAll(regex));
    
    // We get a lot of duplicates and small UI icons. 
    // Usually the actual photos are the ones that appear frequently or have specific lengths,
    // but the easiest way is to filter unique ones.
    const rawUrls = [...new Set(matches.map((m: any) => m[1]))] as string[];
    
    // We want to request high quality versions. Appending '=w1920-h1080-no' forces high resolution.
    // Also, we want to filter out tiny profile icons or generic Google UI assets if any leak through.
    // Real photos typically have long IDs.
    const validPhotoUrls = rawUrls
      .filter(url => url.length > 50) 
      .map(url => `${url}=w1920-h1080-no`);

    return validPhotoUrls;

  } catch (error) {
    console.error("Error fetching Google Photos:", error);
    return [];
  }
}
