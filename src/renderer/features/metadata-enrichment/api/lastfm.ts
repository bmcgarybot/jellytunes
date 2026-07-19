/**
 * Last.fm API Client
 * Provides artist bios, tags, similar artists, and play statistics.
 * Requires a free API key from https://www.last.fm/api/account/create
 */
import axios, { type AxiosInstance } from 'axios';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';

export interface LastFmAlbumInfo {
    artist: string;
    image?: Array<{
        '#text': string;
        size: string;
    }>;
    listeners?: string;
    mbid?: string;
    name: string;
    playcount?: string;
    tags?: {
        tag: Array<{
            name: string;
            url: string;
        }>;
    };
    url?: string;
    wiki?: {
        content: string;
        published: string;
        summary: string;
    };
}

export interface LastFmArtistInfo {
    bio?: {
        content: string;
        published: string;
        summary: string;
    };
    mbid?: string;
    name: string;
    similar?: {
        artist: Array<{
            name: string;
            url: string;
        }>;
    };
    stats?: {
        listeners: string;
        playcount: string;
    };
    tags?: {
        tag: Array<{
            name: string;
            url: string;
        }>;
    };
    url?: string;
}

export interface LastFmTopAlbum {
    artist: {
        name: string;
    };
    image?: Array<{
        '#text': string;
        size: string;
    }>;
    mbid?: string;
    name: string;
    playcount: number;
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
                album: albumName,
                artist: artistName,
                autocorrect: 1,
                method: 'album.getinfo',
            },
        });
        return response.data?.album || null;
    } catch {
        return null;
    }
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
                artist: artistName,
                autocorrect: 1,
                method: 'artist.getinfo',
            },
        });
        return response.data?.artist || null;
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
                artist: artistName,
                autocorrect: 1,
                limit,
                method: 'artist.getsimilar',
            },
        });
        const similar = response.data?.similarartists?.artist;
        if (!Array.isArray(similar)) return [];
        return similar.map((a: { name: string }) => a.name);
    } catch {
        return [];
    }
}

export async function getTopTags(apiKey: string, artistName: string): Promise<string[]> {
    if (!apiKey) return [];
    const client = createClient(apiKey);
    try {
        const response = await client.get('', {
            params: {
                artist: artistName,
                autocorrect: 1,
                method: 'artist.gettoptags',
            },
        });
        const tags = response.data?.toptags?.tag;
        if (!Array.isArray(tags)) return [];
        return tags.slice(0, 10).map((t: { name: string }) => t.name);
    } catch {
        return [];
    }
}

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
