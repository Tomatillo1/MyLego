/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * Service worker myLego :
 * - app shell (build + fichiers statiques) en cache à l'installation ;
 * - pages et données (__data.json) : réseau d'abord, repli sur la dernière
 *   version en cache → affichage « hors ligne — dernière synchronisation » ;
 * - les mutations (POST) ne sont jamais mises en cache ;
 * - pages d'authentification et réinitialisation jamais mises en cache.
 */
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const SHELL = `shell-${version}`;
const PAGES = 'pages-v1';
const ASSETS = [...build, ...files];
const NO_CACHE = /^\/(login|register|forgot-password|reset-password|logout|profil\/avatar)/;

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(SHELL)
			.then((c) => c.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys())
				if (key !== SHELL && key !== PAGES) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('message', (event) => {
	// Déconnexion : on vide les pages en cache (données personnelles)
	if (event.data === 'clear-pages') event.waitUntil(caches.delete(PAGES));
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin) return;

	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(req)));
		return;
	}
	if (NO_CACHE.test(url.pathname)) return;

	const isPage = req.mode === 'navigate' || url.pathname.endsWith('/__data.json');
	if (!isPage) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(PAGES);
			try {
				const res = await fetch(req);
				if (res.ok && res.type === 'basic' && !res.redirected) cache.put(req, res.clone());
				return res;
			} catch {
				const cached = await cache.match(req, { ignoreSearch: false });
				if (cached) return cached;
				const fallback = req.mode === 'navigate' ? await cache.match('/catalogue') : undefined;
				return (
					fallback ??
					new Response('Hors ligne', {
						status: 503,
						headers: { 'Content-Type': 'text/plain; charset=utf-8' }
					})
				);
			}
		})()
	);
});
