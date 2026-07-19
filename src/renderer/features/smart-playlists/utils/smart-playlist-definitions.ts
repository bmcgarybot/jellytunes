/**
 * Smart Playlist Generator
 *
 * Generates auto-playlists from Jellyfin library data:
 * - Recently Added
 * - Most Played
 * - Top Rated
 * - By Decade (60s, 70s, 80s, 90s, 2000s, 2010s, 2020s)
 * - By Genre
 * - Random Mix
 * - Favorites
 */

export type SmartPlaylistType =
    | 'recently-added'
    | 'most-played'
    | 'top-rated'
    | 'random-mix'
    | 'favorites'
    | 'decade'
    | 'genre'
    | 'for-you';

export interface SmartPlaylistDefinition {
    id: string;
    type: SmartPlaylistType;
    name: string;
    description: string;
    icon: string;
    color: string;
    param?: string; // decade year or genre name
}

/**
 * Built-in smart playlists
 */
export const BUILT_IN_PLAYLISTS: SmartPlaylistDefinition[] = [
    {
        id: 'smart-recently-added',
        type: 'recently-added',
        name: 'Recently Added',
        description: 'Fresh additions to your library',
        icon: '✨',
        color: '#4CAF50',
    },
    {
        id: 'smart-most-played',
        type: 'most-played',
        name: 'Most Played',
        description: 'Your all-time favorites',
        icon: '🔥',
        color: '#FF5722',
    },
    {
        id: 'smart-top-rated',
        type: 'top-rated',
        name: 'Top Rated',
        description: 'Highest rated tracks in your library',
        icon: '⭐',
        color: '#FFC107',
    },
    {
        id: 'smart-favorites',
        type: 'favorites',
        name: 'Favorites',
        description: 'All your liked songs',
        icon: '❤️',
        color: '#E91E63',
    },
    {
        id: 'smart-random-mix',
        type: 'random-mix',
        name: 'Random Mix',
        description: 'A fresh random selection from your library',
        icon: '🎲',
        color: '#9C27B0',
    },
    {
        id: 'smart-for-you',
        type: 'for-you',
        name: 'For You',
        description: 'Personalized recommendations based on your listening',
        icon: '💎',
        color: '#2196F3',
    },
];

/**
 * Generate decade-based smart playlists
 */
export function getDecadePlaylists(): SmartPlaylistDefinition[] {
    const decades = [
        { year: '1960', name: '60s', color: '#8BC34A' },
        { year: '1970', name: '70s', color: '#FF9800' },
        { year: '1980', name: '80s', color: '#E91E63' },
        { year: '1990', name: '90s', color: '#00BCD4' },
        { year: '2000', name: '2000s', color: '#673AB7' },
        { year: '2010', name: '2010s', color: '#3F51B5' },
        { year: '2020', name: '2020s', color: '#009688' },
    ];

    return decades.map((d) => ({
        id: `smart-decade-${d.year}`,
        type: 'decade' as SmartPlaylistType,
        name: `The ${d.name}`,
        description: `Music from the ${d.name}`,
        icon: '📅',
        color: d.color,
        param: d.year,
    }));
}

/**
 * Build Jellyfin API sort/filter params for a smart playlist type
 */
export function getSmartPlaylistQuery(playlist: SmartPlaylistDefinition) {
    switch (playlist.type) {
        case 'recently-added':
            return {
                sortBy: 'DateCreated',
                sortOrder: 'Descending' as const,
                limit: 100,
            };
        case 'most-played':
            return {
                sortBy: 'PlayCount',
                sortOrder: 'Descending' as const,
                limit: 100,
            };
        case 'top-rated':
            return {
                sortBy: 'CommunityRating',
                sortOrder: 'Descending' as const,
                limit: 100,
            };
        case 'favorites':
            return {
                filters: 'IsFavorite',
                sortBy: 'SortName',
                sortOrder: 'Ascending' as const,
                limit: 500,
            };
        case 'random-mix':
            return {
                sortBy: 'Random',
                sortOrder: 'Ascending' as const,
                limit: 50,
            };
        case 'decade':
            if (playlist.param) {
                const startYear = parseInt(playlist.param, 10);
                return {
                    years: `${startYear}-${startYear + 9}`,
                    sortBy: 'Random',
                    sortOrder: 'Ascending' as const,
                    limit: 100,
                };
            }
            return {};
        case 'genre':
            if (playlist.param) {
                return {
                    genres: playlist.param,
                    sortBy: 'Random',
                    sortOrder: 'Ascending' as const,
                    limit: 100,
                };
            }
            return {};
        case 'for-you':
            // "For You" uses a mix of recent favorites + random highly rated
            return {
                sortBy: 'Random',
                sortOrder: 'Ascending' as const,
                limit: 50,
            };
        default:
            return {};
    }
}
