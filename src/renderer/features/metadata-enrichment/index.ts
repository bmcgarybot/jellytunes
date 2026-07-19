export { ArtistBioPanel } from './components/artist-bio-panel';
export { MetadataSettingsPanel } from './components/metadata-settings-panel';
export { useArtistMetadata, useAlbumMetadata } from './hooks/use-metadata';
export { useMetadataSettings } from './hooks/use-metadata-settings';
export {
    getEnrichedArtistMetadata,
    getEnrichedAlbumMetadata,
    clearMetadataCache,
} from './api/metadata-service';
export type {
    ArtistMetadata,
    AlbumMetadata,
    TrackMetadata,
    MetadataProviderConfig,
} from './types';
