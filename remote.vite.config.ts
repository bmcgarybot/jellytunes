import path from 'path';
import { defineConfig, normalizePath } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

import { version } from './package.json';
import { createReactPlugin } from './vite.react-plugin';

export default defineConfig({
    build: {
        cssMinify: 'esbuild',
        emptyOutDir: true,
        minify: 'esbuild',
        outDir: path.resolve(__dirname, './out/remote'),
        rollupOptions: {
            input: {
                favicon: normalizePath(path.resolve(__dirname, './assets/icons/favicon.ico')),
                index: normalizePath(path.resolve(__dirname, './src/remote/index.html')),
                manifest: normalizePath(path.resolve(__dirname, './src/remote/manifest.json')),
                remote: normalizePath(path.resolve(__dirname, './src/remote/index.tsx')),
                worker: normalizePath(path.resolve(__dirname, './src/remote/service-worker.ts')),
            },
            output: {
                assetFileNames: '[name].[ext]',
                chunkFileNames: '[name].js',
                entryFileNames: '[name].js',
                manualChunks(id: string) {
                    if (!id.includes('node_modules')) return undefined;
                    const m = id.match(
                        /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@?[^/]+(?:\/[^/]+)?)/,
                    );
                    const pkg = m ? m[1] : '';
                    if (/butterchurn|audiomotion/.test(pkg)) return 'vendor-visualizer';
                    if (/kuroshiro|kuromoji|wanakana/.test(pkg)) return 'vendor-japanese';
                    if (/^react(-dom)?$|react-router|scheduler/.test(pkg)) return 'vendor-react';
                    if (/@mantine|@radix-ui|overlayscrollbars|motion|cmdk|react-icons/.test(pkg))
                        return 'vendor-ui';
                    if (/@tanstack|axios|idb-keyval|fuse\.js|zustand|immer|zod/.test(pkg))
                        return 'vendor-data';
                    if (/i18next/.test(pkg)) return 'vendor-i18n';
                    if (
                        /wavesurfer|icecast|fast-average-color|music-metadata|taglib|react-player/.test(
                            pkg,
                        )
                    )
                        return 'vendor-media';
                    return 'vendor-misc';
                },
                sourcemapExcludeSources: false,
            },
        },
        sourcemap: true,
    },
    css: {
        modules: {
            generateScopedName: 'fs-[name]-[local]',
            localsConvention: 'camelCase',
        },
    },
    plugins: [
        createReactPlugin(),
        ViteEjsPlugin({
            prod: process.env.NODE_ENV === 'production',
            root: normalizePath(path.resolve(__dirname, './src/remote')),
            version,
        }),
    ],
    resolve: {
        alias: {
            '/@/i18n': path.resolve(__dirname, './src/i18n'),
            '/@/remote': path.resolve(__dirname, './src/remote'),
            '/@/renderer': path.resolve(__dirname, './src/renderer'),
            '/@/shared': path.resolve(__dirname, './src/shared'),
        },
    },
    root: path.resolve(__dirname, './src/remote'),
});
