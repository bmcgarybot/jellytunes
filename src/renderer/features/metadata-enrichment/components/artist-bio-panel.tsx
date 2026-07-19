/**
 * Artist Biography Panel
 * Displays enriched artist info from Last.fm / MusicBrainz
 */
import { useArtistMetadata } from '../hooks/use-metadata';
import styles from './artist-bio.module.css';

interface ArtistBioPanelProps {
    artistName: string;
}

export function ArtistBioPanel({ artistName }: ArtistBioPanelProps) {
    const { data: metadata, isLoading, error } = useArtistMetadata(artistName);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.skeleton}>Loading artist info...</div>
            </div>
        );
    }

    if (error || !metadata) {
        return null;
    }

    const hasBio = metadata.biography && metadata.biography.length > 10;
    const hasGenres = metadata.genres && metadata.genres.length > 0;
    const hasSimilar = metadata.similarArtists && metadata.similarArtists.length > 0;
    const hasStats = metadata.listeners || metadata.playCount;

    if (!hasBio && !hasGenres && !hasSimilar) {
        return null;
    }

    return (
        <div className={styles.container}>
            {metadata.backgroundImages?.[0] && (
                <div
                    className={styles.backgroundImage}
                    style={{
                        backgroundImage: `url(${metadata.backgroundImages[0]})`,
                    }}
                />
            )}

            <div className={styles.content}>
                {hasBio && (
                    <div className={styles.bioSection}>
                        <h3 className={styles.sectionTitle}>About</h3>
                        <p className={styles.bioText}>{metadata.biography}</p>
                        {metadata.biographySource && (
                            <span className={styles.source}>
                                Source: {metadata.biographySource}
                            </span>
                        )}
                    </div>
                )}

                {hasStats && (
                    <div className={styles.statsSection}>
                        {metadata.listeners && (
                            <div className={styles.stat}>
                                <span className={styles.statValue}>
                                    {metadata.listeners.toLocaleString()}
                                </span>
                                <span className={styles.statLabel}>listeners</span>
                            </div>
                        )}
                        {metadata.playCount && (
                            <div className={styles.stat}>
                                <span className={styles.statValue}>
                                    {metadata.playCount.toLocaleString()}
                                </span>
                                <span className={styles.statLabel}>plays</span>
                            </div>
                        )}
                        {metadata.country && (
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{metadata.country}</span>
                                <span className={styles.statLabel}>origin</span>
                            </div>
                        )}
                    </div>
                )}

                {hasGenres && (
                    <div className={styles.genresSection}>
                        <h4 className={styles.sectionTitle}>Genres</h4>
                        <div className={styles.tagList}>
                            {metadata.genres!.slice(0, 8).map((genre) => (
                                <span key={genre} className={styles.tag}>
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {hasSimilar && (
                    <div className={styles.similarSection}>
                        <h4 className={styles.sectionTitle}>Similar Artists</h4>
                        <div className={styles.tagList}>
                            {metadata.similarArtists!.slice(0, 6).map((name) => (
                                <span key={name} className={styles.similarTag}>
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
