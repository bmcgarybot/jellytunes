import type { AlbumMetadata, ArtistMetadata } from '../types';

import * as fanartTv from './fanart-tv';
import * as lastfm from './lastfm';
/**
 * JellyTunes Metadata Enrichment Service
 *
 * Orchestrates MusicBrainz, Last.fm, and Fanart.tv to provide
 * Apple Music-level metadata for personal Jellyfin libraries.
 *
 * Features:
 * - Artist biographies, images, genres, similar artists
 * - Album descriptions, cover art, ratings
 * - In-memory LRU cache to minimize API calls
 * - Rate limiting for MusicBrainz compliance
 */
import * as musicbrainz from './musicbrainz';

// Simple in-memory cache with TTL
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class MetadataCache<T> {
    private cache = new Map<string, CacheEntry<T>>();

    get(key: string): null | T {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key: string, data: T): void {
        // Evict oldest if at capacity
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}

const artistCache = new MetadataCache<ArtistMetadata>();
const albumCache = new MetadataCache<AlbumMetadata>();

/**
 * Clear all metadata caches
 */
export function clearMetadataCache(): void {
    artistCache['cache'].clear();
    albumCache['cache'].clear();
}

/**
 * Get enriched album metadata from all available sources
 */
export async function getEnrichedAlbumMetadata(
    albumName: string,
    artistName: string,
    options?: {
        fanartTvApiKey?: string;
        lastfmApiKey?: string;
    },
): Promise<AlbumMetadata> {
    const cacheKey = `${artistName}::${albumName}`.toLowerCase().trim();
    const cached = albumCache.get(cacheKey);
    if (cached) return cached;

    const result: AlbumMetadata = { artist: artistName, name: albumName };

    // Step 1: Search MusicBrainz
    const mbRelease = await musicbrainz.searchRelease(albumName, artistName);
    if (mbRelease) {
        result.musicBrainzId = mbRelease.id;
        result.releaseDate = mbRelease.date;
        result.type = mbRelease['release-group']?.['primary-type'];

        if (mbRelease['label-info']?.[0]?.label?.name) {
            result.label = mbRelease['label-info'][0].label.name;
        }

        // Get detailed info
        const details = await musicbrainz.getReleaseDetails(mbRelease.id);
        if (details) {
            result.genres =
                details.genres?.sort((a, b) => b.count - a.count).map((g) => g.name) || [];
            result.tags =
                details.tags
                    ?.sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((t) => t.name) || [];
        }

        // Get cover art from Cover Art Archive
        const coverUrl = await musicbrainz.getCoverArt(mbRelease.id);
        if (coverUrl) {
            result.coverArtUrls = [coverUrl];
        }
    }

    // Step 2: Last.fm album info
    if (options?.lastfmApiKey) {
        const lfmAlbum = await lastfm.getAlbumInfo(options.lastfmApiKey, artistName, albumName);
        if (lfmAlbum) {
            if (lfmAlbum.wiki?.content) {
                result.description = lfmAlbum.wiki.content
                    .replace(/<a\b[^>]*>.*?<\/a>/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                result.descriptionSource = 'Last.fm';
            }
            if (lfmAlbum.tags?.tag) {
                const lfmTags = lfmAlbum.tags.tag.map((t) => t.name);
                result.tags = [...new Set([...(result.tags || []), ...lfmTags])];
            }
        }
    }

    // Step 3: Fanart.tv album images
    if (options?.fanartTvApiKey && result.musicBrainzId) {
        const images = await fanartTv.getAlbumImages(options.fanartTvApiKey, result.musicBrainzId);
        if (images) {
            if (images.albumcover?.length) {
                const covers = fanartTv.sortedImageUrls(images.albumcover);
                result.coverArtUrls = [...new Set([...(result.coverArtUrls || []), ...covers])];
            }
            result.cdArtUrls = fanartTv.sortedImageUrls(images.cdart);
        }
    }

    albumCache.set(cacheKey, result);
    return result;
}

/**
 * Get enriched artist metadata from all available sources
 */
export async function getEnrichedArtistMetadata(
    artistName: string,
    options?: {
        fanartTvApiKey?: string;
        lastfmApiKey?: string;
    },
): Promise<ArtistMetadata> {
    const cacheKey = artistName.toLowerCase().trim();
    const cached = artistCache.get(cacheKey);
    if (cached) return cached;

    const result: ArtistMetadata = { name: artistName };

    // Step 1: Search MusicBrainz for the MBID
    const mbArtist = await musicbrainz.searchArtist(artistName);
    if (mbArtist) {
        result.musicBrainzId = mbArtist.id;
        result.country = mbArtist.country;
        result.formedYear = mbArtist['life-span']?.begin;

        // Get detailed info including tags, genres, and relations
        const details = await musicbrainz.getArtistDetails(mbArtist.id);
        if (details) {
            result.genres =
                details.genres?.sort((a, b) => b.count - a.count).map((g) => g.name) || [];
            result.tags =
                details.tags
                    ?.sort((a, b) => b.count - a.count)
                    .slice(0, 15)
                    .map((t) => t.name) || [];

            // Extract website from relations
            const websiteRel = details.relations?.find((r) => r.type === 'official homepage');
            if (websiteRel?.url?.resource) {
                result.website = websiteRel.url.resource;
            }
        }
    }

    // Step 2: Get Last.fm data (bio, similar artists, stats)
    if (options?.lastfmApiKey) {
        const lfmInfo = await lastfm.getArtistInfo(options.lastfmApiKey, artistName);
        if (lfmInfo) {
            if (lfmInfo.bio?.content) {
                // Clean up Last.fm bio (remove HTML links and "Read more" text)
                result.biography = lfmInfo.bio.content
                    .replace(/<a\b[^>]*>.*?<\/a>/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                result.biographySource = 'Last.fm';
            }
            if (lfmInfo.stats) {
                result.listeners = parseInt(lfmInfo.stats.listeners, 10);
                result.playCount = parseInt(lfmInfo.stats.playcount, 10);
            }
            if (lfmInfo.similar?.artist) {
                result.similarArtists = lfmInfo.similar.artist.map((a) => a.name);
            }
            result.lastFmUrl = lfmInfo.url;

            // Merge Last.fm tags with MusicBrainz genres
            if (lfmInfo.tags?.tag) {
                const lfmTags = lfmInfo.tags.tag.map((t) => t.name);
                result.tags = [...new Set([...(result.tags || []), ...lfmTags])];
            }
        }
    }

    // Step 3: Get Fanart.tv images
    if (options?.fanartTvApiKey && result.musicBrainzId) {
        const images = await fanartTv.getArtistImages(options.fanartTvApiKey, result.musicBrainzId);
        if (images) {
            result.backgroundImages = fanartTv.sortedImageUrls(images.artistbackground);
            result.thumbnailImages = fanartTv.sortedImageUrls(images.artistthumb);
            result.bannerImages = fanartTv.sortedImageUrls(images.musicbanner);
            result.logoImages = fanartTv.sortedImageUrls(images.hdmusiclogo || images.musiclogo);
        }
    }

    artistCache.set(cacheKey, result);
    return result;
}
