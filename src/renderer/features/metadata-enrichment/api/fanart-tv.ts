/**
 * Fanart.tv API Client
 * Provides high-quality artist images: backgrounds, thumbnails, logos, banners.
 * Requires a free API key from https://fanart.tv/get-an-api-key/
 */
import axios from 'axios';

const FANART_BASE = 'https://webservice.fanart.tv/v3/music';

export interface FanartArtistImages {
    artistbackground?: Array<{ url: string; likes: string }>;
    artistthumb?: Array<{ url: string; likes: string }>;
    musiclogo?: Array<{ url: string; likes: string }>;
    hdmusiclogo?: Array<{ url: string; likes: string }>;
    musicbanner?: Array<{ url: string; likes: string }>;
}

export interface FanartAlbumImages {
    albumcover?: Array<{ url: string; likes: string }>;
    cdart?: Array<{ url: string; likes: string }>;
}

export async function getArtistImages(
    apiKey: string,
    musicBrainzId: string,
): Promise<FanartArtistImages | null> {
    if (!apiKey || !musicBrainzId) return null;
    try {
        const response = await axios.get(`${FANART_BASE}/${musicBrainzId}`, {
            params: { api_key: apiKey },
            timeout: 10000,
        });
        return response.data || null;
    } catch {
        return null;
    }
}

export async function getAlbumImages(
    apiKey: string,
    musicBrainzAlbumId: string,
): Promise<FanartAlbumImages | null> {
    if (!apiKey || !musicBrainzAlbumId) return null;
    try {
        const response = await axios.get(`${FANART_BASE}/albums/${musicBrainzAlbumId}`, {
            params: { api_key: apiKey },
            timeout: 10000,
        });
        return response.data?.albums?.[musicBrainzAlbumId] || null;
    } catch {
        return null;
    }
}

/**
 * Sort images by likes (most popular first) and return URLs
 */
export function sortedImageUrls(
    images?: Array<{ url: string; likes: string }>,
): string[] {
    if (!images?.length) return [];
    return [...images]
        .sort((a, b) => parseInt(b.likes, 10) - parseInt(a.likes, 10))
        .map((img) => img.url);
}
