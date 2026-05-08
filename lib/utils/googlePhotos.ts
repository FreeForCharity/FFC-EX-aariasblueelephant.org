export async function fetchGooglePhotosAlbum(albumUrl: string): Promise<string[]> {
  if (!albumUrl) return [];
  
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(albumUrl)}&disableCache=true`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch album');
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) return [];

    const regex = /"(https:\/\/[a-z0-9]+\.googleusercontent\.com\/[a-zA-Z0-9\-_]+)"/g;
    const matches = Array.from(html.matchAll(regex));
    const rawUrls = [...new Set(matches.map((m: any) => m[1]))] as string[];
    
    const validPhotoUrls = rawUrls
      .filter(url => {
        const isProfileIcon = url.includes('placeholder') || url.includes('profile');
        return url.length > 70 && !isProfileIcon;
      })
      .map(url => `${url}=w1920-h1080-no`);

    return validPhotoUrls.slice(0, 30);

  } catch (error) {
    console.error("Error fetching Google Photos:", error);
    return [];
  }
}
