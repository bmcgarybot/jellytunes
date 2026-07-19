/**
 * JellyTunes Metadata Enrichment Service
 *
 * Fetches artist bios, album art, genres, ratings, and artist images
 * from external metadata providers:
 * - MusicBrainz (open, no key required)
 * - Last.fm (free API key)
 * - Fanart.tv (free API key)
 * - TheAudioDB (free tier)
 */

export interface MetadataProviderConfig {
    musicbrainz: {
        enabled: boolean;
        userAgent: string;
        baseUrl: string;
        rateLimitMs: number;
    };
    lastfm: {
        enabled: boolean;
        apiKey: string;
        baseUrl: string;
    };
    fanartTv: {
        enabled: boolean;
        apiKey: string;
        baseUrl: string;
    };
    theAudioDb: {
        enabled: boolean;
        baseUrl: string;
    };
}

export interface ArtistMetadata {
    name: string;
    biography?: string;
    biographySource?: string;
    musicBrainzId?: string;
    genres?: string[];
    tags?: string[];
    similarArtists?: string[];
    backgroundImages?: string[];
    thumbnailImages?: string[];
    bannerImages?: string[];
    logoImages?: string[];
    country?: string;
    formedYear?: string;
    website?: string;
    lastFmUrl?: string;
    listeners?: number;
    playCount?: number;
}

export interface AlbumMetadata {
    name: string;
    artist: string;
    musicBrainzId?: string;
    releaseDate?: string;
    genres?: string[];
    tags?: string[];
    rating?: number;
    ratingCount?: number;
    coverArtUrls?: string[];
    cdArtUrls?: string[];
    description?: string;
    descriptionSource?: string;
    label?: string;
    type?: string;
}

export interface TrackMetadata {
    name: string;
    artist: string;
    album?: string;
    musicBrainzId?: string;
    duration?: number;
    genres?: string[];
    tags?: string[];
    lyrics?: string;
}

export interface MetadataSearchResult<T> {
    data: T | null;
    source: string;
    cached: boolean;
    error?: string;
}
