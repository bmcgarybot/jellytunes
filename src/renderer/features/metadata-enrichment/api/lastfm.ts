/**
 * Last.fm API Client
 * Provides artist bios, tags, similar artists, and play statistics.
 * Requires a free API key from https://www.last.fm/api/account/create
 */
import axios, { type AxiosInstance } from 'axios';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';

function createClient(apiKey: string): AxiosInstance {
    return axios.create({
        baseURL: LASTFM_BASE,
        params: {
            api_key: apiKey,
            format: 'json',
        },
        timeout: 10000,
    });
}

export interface LastFmArtistInfo {
    name: string;
    mbid?: string;
    url?: string;
    stats?: {
        listeners: string;
        playcount: string;
    };
    similar?: {
        artist: Array<{
            name: string;
            url: string;
        }>;
    };
    tags?: {
        tag: Array<{
            name: string;
            url: string;
        }>;
    };
    bio?: {
        summary: string;
        content: string;
        published: string;
    };
}

export interface LastFmAlbumInfo {
    name: string;
    artist: string;
    mbid?: string;
    url?: string;
    listeners?: string;
    playcount?: string;
    tags?: {
        tag: Array<{
            name: string;
            url: string;
        }>;
    };
    wiki?: {
        summary: string;
        content: string;
        published: string;
    };
    image?: Array<{
        '#text': string;
        size: string;
    }>;
}

export interface LastFmTopAlbum {
    name: string;
    playcount: number;
    mbid?: string;
    artist: {
        name: string;
    };
    image?: Array<{
        '#text': string;
        size: string;
    }>;
}

export async function getArtistInfo(
    apiKey: string,
    artistName: string,
): Promise<LastFmArtistInfo | null> {
    if (!apiKey) return null;
    const client = createClient(apiKey);
    try {
        const response = await client.get('', {
            params: {
                method: 'artist.getinfo',
                artist: artistName,
                autocorrect: 1,
            },
        });
        return response.data?.artist || null;
    } catch {
        return null;
    }
}

export async function getAlbumInfo(
    apiKey: string,
    artistName: string,
    albumName: string,
): Promise<LastFmAlbumInfo | null> {
    if (!apiKey) return null;
    const client = createClient(apiKey);
    try {
        const response = await client.get('', {
            params: {
                method: 'album.getinfo',
                artist: artistName,
                album: albumName,
                autocorrect: 1,
            },
        });
        return response.data?.album || null;
    } catch {
        return null;
    }
}

export async function getSimilarArtists(
    apiKey: string,
    artistName: string,
    limit = 10,
): Promise<string[]> {
    if (!apiKey) return [];
    const client = createClient(apiKey);
    try {
        const response = await client.get('', {
            params: {
                method: 'artist.getsimilar',
                artist: artistName,
                limit,
                autocorrect: 1,
            },
        });
        const similar = response.data?.similarartists?.artist;
        if (!Array.isArray(similar)) return [];
        return similar.map((a: { name: string }) => a.name);
    } catch {
        return [];
    }
}

export async function getTopTags(
    apiKey: string,
    artistName: string,
): Promise<string[]> {
    if (!apiKey) return [];
    const client = createClient(apiKey);
    try {
        const response = await client.get('', {
            params: {
                method: 'artist.gettoptags',
                artist: artistName,
                autocorrect: 1,
            },
        });
        const tags = response.data?.toptags?.tag;
        if (!Array.isArray(tags)) return [];
        return tags.slice(0, 10).map((t: { name: string }) => t.name);
    } catch {
        return [];
    }
}
