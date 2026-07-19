/**
 * MusicBrainz API Client
 * Free, open metadata source. Rate limited to 1 req/sec.
 */
import axios, { type AxiosInstance } from 'axios';

const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const RATE_LIMIT_MS = 1100; // 1 req/sec + buffer

let lastRequestTime = 0;
// Serializes requests: concurrent callers previously all read the same
// lastRequestTime and fired together, tripping MusicBrainz's hard
// 1 req/sec limit (503s and temporary bans).
let requestChain: Promise<unknown> = Promise.resolve();

export interface MusicBrainzArtist {
    country?: string;
    disambiguation?: string;
    genres?: Array<{ count: number; name: string }>;
    id: string;
    'life-span'?: {
        begin?: string;
        end?: string;
        ended?: boolean;
    };
    name: string;
    relations?: Array<{
        type: string;
        url?: { resource: string };
    }>;
    tags?: Array<{ count: number; name: string }>;
    type?: string;
}

export interface MusicBrainzRelease {
    country?: string;
    date?: string;
    genres?: Array<{ count: number; name: string }>;
    id: string;
    'label-info'?: Array<{
        label?: { name: string };
    }>;
    'release-group'?: {
        id: string;
        'primary-type'?: string;
        title: string;
    };
    tags?: Array<{ count: number; name: string }>;
    title: string;
}

export async function getArtistDetails(mbid: string): Promise<MusicBrainzArtist | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get(`/artist/${mbid}`, {
                params: {
                    fmt: 'json',
                    inc: 'tags+genres+url-rels',
                },
            }),
        );
        return response.data;
    } catch {
        return null;
    }
}

export async function getCoverArt(mbid: string): Promise<null | string> {
    try {
        const response = await rateLimitedRequest(() =>
            axios.get(`https://coverartarchive.org/release/${mbid}`, {
                headers: {
                    'User-Agent': 'JellyTunes/0.1.0 (https://github.com/bmcgarybot/jellytunes)',
                },
                timeout: 10000,
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

export async function getReleaseDetails(mbid: string): Promise<MusicBrainzRelease | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get(`/release/${mbid}`, {
                params: {
                    fmt: 'json',
                    inc: 'tags+genres+labels+release-groups',
                },
            }),
        );
        return response.data;
    } catch {
        return null;
    }
}

export async function searchArtist(name: string): Promise<MusicBrainzArtist | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get('/artist', {
                params: {
                    fmt: 'json',
                    limit: 5,
                    query: `artist:"${escapeLucene(name)}"`,
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

export async function searchRelease(
    albumName: string,
    artistName: string,
): Promise<MusicBrainzRelease | null> {
    const client = createClient();
    try {
        const response = await rateLimitedRequest(() =>
            client.get('/release', {
                params: {
                    fmt: 'json',
                    limit: 5,
                    query: `release:"${escapeLucene(albumName)}" AND artist:"${escapeLucene(artistName)}"`,
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

function createClient(): AxiosInstance {
    return axios.create({
        baseURL: MUSICBRAINZ_BASE,
        headers: {
            Accept: 'application/json',
            'User-Agent': 'JellyTunes/0.1.0 (https://github.com/bmcgarybot/jellytunes)',
        },
        timeout: 10000,
    });
}

/** Escape Lucene special characters so names like '"Weird Al" Yankovic'
 *  or 'AC/DC' don't break (or alter) the search query. */
function escapeLucene(value: string): string {
    return value.replace(/[+\-!(){}[\]^"~*?:\\/&|]/g, '\\$&');
}

async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
        const timeSinceLast = Date.now() - lastRequestTime;
        if (timeSinceLast < RATE_LIMIT_MS) {
            await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLast));
        }
        lastRequestTime = Date.now();
        return fn();
    };
    const next = requestChain.then(run, run);
    // Keep the chain alive even when a request fails
    requestChain = next.catch(() => undefined);
    return next;
}
