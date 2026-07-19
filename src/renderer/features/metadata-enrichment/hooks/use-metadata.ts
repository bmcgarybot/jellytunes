/**
 * React hooks for metadata enrichment
 */
import { useQuery } from '@tanstack/react-query';

import { getEnrichedAlbumMetadata, getEnrichedArtistMetadata } from '../api/metadata-service';
import { useMetadataSettings } from './use-metadata-settings';

/**
 * Hook to fetch enriched album metadata
 */
export function useAlbumMetadata(albumName: string | undefined, artistName: string | undefined) {
    const { enrichmentEnabled, fanartTvApiKey, lastfmApiKey } = useMetadataSettings();

    return useQuery({
        enabled: !!albumName && !!artistName && enrichmentEnabled,
        gcTime: 60 * 60 * 1000,
        queryFn: () =>
            getEnrichedAlbumMetadata(albumName!, artistName!, {
                fanartTvApiKey: fanartTvApiKey || undefined,
                lastfmApiKey: lastfmApiKey || undefined,
            }),
        queryKey: ['jellytunes', 'album-metadata', albumName, artistName],
        retry: 1,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Hook to fetch enriched artist metadata
 */
export function useArtistMetadata(artistName: string | undefined) {
    const { enrichmentEnabled, fanartTvApiKey, lastfmApiKey } = useMetadataSettings();

    return useQuery({
        enabled: !!artistName && enrichmentEnabled,
        gcTime: 60 * 60 * 1000, // 1 hour
        queryFn: () =>
            getEnrichedArtistMetadata(artistName!, {
                fanartTvApiKey: fanartTvApiKey || undefined,
                lastfmApiKey: lastfmApiKey || undefined,
            }),
        queryKey: ['jellytunes', 'artist-metadata', artistName],
        retry: 1,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}
