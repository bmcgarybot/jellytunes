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

export interface AlbumMetadata {
    artist: string;
    cdArtUrls?: string[];
    coverArtUrls?: string[];
    description?: string;
    descriptionSource?: string;
    genres?: string[];
    label?: string;
    musicBrainzId?: string;
    name: string;
    rating?: number;
    ratingCount?: number;
    releaseDate?: string;
    tags?: string[];
    type?: string;
}

export interface ArtistMetadata {
    backgroundImages?: string[];
    bannerImages?: string[];
    biography?: string;
    biographySource?: string;
    country?: string;
    formedYear?: string;
    genres?: string[];
    lastFmUrl?: string;
    listeners?: number;
    logoImages?: string[];
    musicBrainzId?: string;
    name: string;
    playCount?: number;
    similarArtists?: string[];
    tags?: string[];
    thumbnailImages?: string[];
    website?: string;
}

export interface MetadataProviderConfig {
    fanartTv: {
        apiKey: string;
        baseUrl: string;
        enabled: boolean;
    };
    lastfm: {
        apiKey: string;
        baseUrl: string;
        enabled: boolean;
    };
    musicbrainz: {
        baseUrl: string;
        enabled: boolean;
        rateLimitMs: number;
        userAgent: string;
    };
    theAudioDb: {
        baseUrl: string;
        enabled: boolean;
    };
}

export interface MetadataSearchResult<T> {
    cached: boolean;
    data: null | T;
    error?: string;
    source: string;
}

export interface TrackMetadata {
    album?: string;
    artist: string;
    duration?: number;
    genres?: string[];
    lyrics?: string;
    musicBrainzId?: string;
    name: string;
    tags?: string[];
}
