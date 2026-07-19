/**
 * Fanart.tv API Client
 * Provides high-quality artist images: backgrounds, thumbnails, logos, banners.
 * Requires a free API key from https://fanart.tv/get-an-api-key/
 */
import axios from 'axios';

const FANART_BASE = 'https://webservice.fanart.tv/v3/music';

export interface FanartAlbumImages {
    albumcover?: Array<{ likes: string; url: string }>;
    cdart?: Array<{ likes: string; url: string }>;
}

export interface FanartArtistImages {
    artistbackground?: Array<{ likes: string; url: string }>;
    artistthumb?: Array<{ likes: string; url: string }>;
    hdmusiclogo?: Array<{ likes: string; url: string }>;
    musicbanner?: Array<{ likes: string; url: string }>;
    musiclogo?: Array<{ likes: string; url: string }>;
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

/**
 * Sort images by likes (most popular first) and return URLs
 */
export function sortedImageUrls(images?: Array<{ likes: string; url: string }>): string[] {
    if (!images?.length) return [];
    return [...images]
        .sort((a, b) => parseInt(b.likes, 10) - parseInt(a.likes, 10))
        .map((img) => img.url);
}
