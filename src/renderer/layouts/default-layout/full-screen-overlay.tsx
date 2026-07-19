import { AnimatePresence } from 'motion/react';
import { lazy, Suspense } from 'react';

import { useFullScreenPlayerStore } from '/@/renderer/store';

// The full-screen player (and everything it pulls in — lyrics view,
// visualizer context, mobile header) only exists once the user expands
// it, so its code loads on first open instead of at startup.
const FullScreenPlayer = lazy(() =>
    import('/@/renderer/features/player/components/full-screen-player').then((m) => ({
        default: m.FullScreenPlayer,
    })),
);

export const FullScreenOverlay = () => {
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();

    return (
        <AnimatePresence initial={false}>
            {isFullScreenPlayerExpanded && (
                <Suspense fallback={null}>
                    <FullScreenPlayer />
                </Suspense>
            )}
        </AnimatePresence>
    );
};
