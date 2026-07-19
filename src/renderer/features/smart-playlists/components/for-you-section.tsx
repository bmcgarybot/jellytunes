import type { SmartPlaylistDefinition } from '../utils/smart-playlist-definitions';

/**
 * "For You" section component — Apple Music-inspired discovery page
 */
import { BUILT_IN_PLAYLISTS, getDecadePlaylists } from '../utils/smart-playlist-definitions';
import styles from './for-you.module.css';

interface ForYouSectionProps {
    genres?: string[];
    onPlaylistClick?: (playlist: SmartPlaylistDefinition) => void;
}

export function ForYouSection({ genres = [], onPlaylistClick }: ForYouSectionProps) {
    const decadePlaylists = getDecadePlaylists();

    // Build genre playlists from available genres
    const genrePlaylists: SmartPlaylistDefinition[] = genres.slice(0, 12).map((genre) => ({
        color: stringToColor(genre),
        description: `All ${genre} tracks in your library`,
        icon: '🎵',
        id: `smart-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
        name: genre,
        param: genre,
        type: 'genre' as const,
    }));

    return (
        <div className={styles['for-you-container']}>
            <div className={styles.header}>
                <h1 className={styles.title}>For You</h1>
                <p className={styles.subtitle}>Your personalized music experience</p>
            </div>

            {/* Main Smart Playlists */}
            <section className={styles.section}>
                <h2 className={styles['section-title']}>Made for You</h2>
                <div className={styles['playlist-grid']}>
                    {BUILT_IN_PLAYLISTS.map((playlist) => (
                        <button
                            className={styles['playlist-card']}
                            key={playlist.id}
                            onClick={() => onPlaylistClick?.(playlist)}
                            style={{
                                background: `linear-gradient(135deg, ${playlist.color}dd, ${playlist.color}88)`,
                            }}
                        >
                            <span className={styles['playlist-icon']}>{playlist.icon}</span>
                            <span className={styles['playlist-name']}>{playlist.name}</span>
                            <span className={styles['playlist-desc']}>{playlist.description}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Decades */}
            <section className={styles.section}>
                <h2 className={styles['section-title']}>Browse by Decade</h2>
                <div className={styles['decade-grid']}>
                    {decadePlaylists.map((playlist) => (
                        <button
                            className={styles['decade-card']}
                            key={playlist.id}
                            onClick={() => onPlaylistClick?.(playlist)}
                            style={{
                                background: `linear-gradient(135deg, ${playlist.color}cc, ${playlist.color}66)`,
                            }}
                        >
                            <span className={styles['decade-name']}>{playlist.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Genres */}
            {genrePlaylists.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles['section-title']}>Browse by Genre</h2>
                    <div className={styles['genre-grid']}>
                        {genrePlaylists.map((playlist) => (
                            <button
                                className={styles['genre-card']}
                                key={playlist.id}
                                onClick={() => onPlaylistClick?.(playlist)}
                                style={{
                                    background: `linear-gradient(135deg, ${playlist.color}cc, ${playlist.color}66)`,
                                }}
                            >
                                <span className={styles['genre-name']}>{playlist.name}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

/**
 * Deterministic color from string
 */
function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 65%, 45%)`;
}
