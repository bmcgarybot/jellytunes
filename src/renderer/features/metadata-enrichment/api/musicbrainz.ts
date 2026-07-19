/**
 * MusicBrainz API Client
 * Free, open metadata source. Rate limited to 1 req/sec.
 */
import axios, { type AxiosInstance } from 'axios';

const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const RATE_LIMIT_MS = 1100; // 1 req/sec + buffer

let lastRequestTime = 0;

function createClient(): AxiosInstance {
    return axios.create({
        baseURL: MUSICBRAINZ_BASE,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'JellyTunes/0.1.0 (https://github.com/bmcgarybot/jellytunes)',
        },
        timeout: 10000,
    });
}

async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < RATE_LIMIT_MS) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLast));
    }
    lastRequestTime = Date.now();
    return fn();
}

export interface MusicBrainzArtist {
    id: string;
    name: string;
    country?: string;
    disambiguation?: string;
    'life-span'?: {
        begin?: string;
        end?: string;
        ended?: boolean;
    };
    type?: string;
    tags?: Array<{ name: string; count: number }>;
    genres?: Array<{ name: string; count: number }>;
    relations?: Array<{
        type: string;
        url?: { resource: string };
    }>;
}

export interface MusicBrainzRelease {
    id: string;
    title: string;
    date?: string;
    country?: string;
    'release-group'?: {
        id: string;
        'primary-type'?: string;
        title: string;
    };
    'label-info'?: Array<{
        label?: { name: string };
    }>;
    tags?: Array<{ name: string; count: number }>;
    genres?: Array<{ name: string; count: number }>;
}

export async function searchArtist(name: string): Promise<MusicBrainzArtist | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get('/artist', {
                params: {
                    query: `artist:"${name}"`,
                    limit: 5,
                    fmt: 'json',
                },
            }),
        );
        const artists = response.data?.artists;
        if (!artists?.length) return null;

        // Find best match (exact name match preferred)
        const exactMatch = artists.find(
            (a: MusicBrainzArtist) => a.name.toLowerCase() === name.toLowerCase(),
        );
        return exactMatch || artists[0];
    } catch {
        return null;
    }
}

export async function getArtistDetails(mbid: string): Promise<MusicBrainzArtist | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get(`/artist/${mbid}`, {
                params: {
                    inc: 'tags+genres+url-rels',
                    fmt: 'json',
                },
            }),
        );
        return response.data;
    } catch {
        return null;
    }
}

export async function searchRelease(
    albumName: string,
    artistName: string,
): Promise<MusicBrainzRelease | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get('/release', {
                params: {
                    query: `release:"${albumName}" AND artist:"${artistName}"`,
                    limit: 5,
                    fmt: 'json',
                },
            }),
        );
        const releases = response.data?.releases;
        if (!releases?.length) return null;
        return releases[0];
    } catch {
        return null;
    }
}

export async function getReleaseDetails(mbid: string): Promise<MusicBrainzRelease | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get(`/release/${mbid}`, {
                params: {
                    inc: 'tags+genres+labels+release-groups',
                    fmt: 'json',
                },
            }),
        );
        return response.data;
    } catch {
        return null;
    }
}

export async function getCoverArt(mbid: string): Promise<string | null> {
    try {
        const response = await rateLimitedRequest(() =>
            axios.get(`https://coverartarchive.org/release/${mbid}`, {
                timeout: 10000,
                headers: {
                    'User-Agent':
                        'JellyTunes/0.1.0 (https://github.com/bmcgarybot/jellytunes)',
                },
            }),
        );
        const images = response.data?.images;
        if (!images?.length) return null;

        // Prefer front cover
        const front = images.find((img: { front: boolean }) => img.front);
        return front?.thumbnails?.large || front?.image || images[0]?.image || null;
    } catch {
        return null;
    }
}
