import { browser } from '$app/environment';

/** État réseau (PWA hors ligne). */
export const network = $state({ online: browser ? navigator.onLine : true });

if (browser) {
	window.addEventListener('online', () => (network.online = true));
	window.addEventListener('offline', () => (network.online = false));
}
