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
    const { data: metadata, error, isLoading } = useArtistMetadata(artistName);

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
                    className={styles['background-image']}
                    style={{
                        backgroundImage: `url(${metadata.backgroundImages[0]})`,
                    }}
                />
            )}

            <div className={styles.content}>
                {hasBio && (
                    <div className={styles['bio-section']}>
                        <h3 className={styles['section-title']}>About</h3>
                        <p className={styles['bio-text']}>{metadata.biography}</p>
                        {metadata.biographySource && (
                            <span className={styles.source}>
                                Source: {metadata.biographySource}
                            </span>
                        )}
                    </div>
                )}

                {hasStats && (
                    <div className={styles['stats-section']}>
                        {metadata.listeners && (
                            <div className={styles.stat}>
                                <span className={styles['stat-value']}>
                                    {metadata.listeners.toLocaleString()}
                                </span>
                                <span className={styles['stat-label']}>listeners</span>
                            </div>
                        )}
                        {metadata.playCount && (
                            <div className={styles.stat}>
                                <span className={styles['stat-value']}>
                                    {metadata.playCount.toLocaleString()}
                                </span>
                                <span className={styles['stat-label']}>plays</span>
                            </div>
                        )}
                        {metadata.country && (
                            <div className={styles.stat}>
                                <span className={styles['stat-value']}>{metadata.country}</span>
                                <span className={styles['stat-label']}>origin</span>
                            </div>
                        )}
                    </div>
                )}

                {hasGenres && (
                    <div className={styles['genres-section']}>
                        <h4 className={styles['section-title']}>Genres</h4>
                        <div className={styles['tag-list']}>
                            {metadata.genres!.slice(0, 8).map((genre) => (
                                <span className={styles.tag} key={genre}>
                                    {genre}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {hasSimilar && (
                    <div className={styles['similar-section']}>
                        <h4 className={styles['section-title']}>Similar Artists</h4>
                        <div className={styles['tag-list']}>
                            {metadata.similarArtists!.slice(0, 6).map((name) => (
                                <span className={styles['similar-tag']} key={name}>
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
