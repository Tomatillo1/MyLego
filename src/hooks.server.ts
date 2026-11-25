import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.sessionToken = token;
	event.locals.user = await validateSession(token, event.cookies);
	if (token && !event.locals.user) event.cookies.delete(SESSION_COOKIE, { path: '/' });

	const id = event.route.id ?? '';
	if (id.startsWith('/(app)') && !event.locals.user) {
		const next = event.url.pathname + event.url.search;
		redirect(303, `/login${next && next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`);
	}
	if (id.startsWith('/(auth)') && event.locals.user && !id.startsWith('/(auth)/reset-password')) {
		redirect(303, '/catalogue');
	}

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	// Pages authentifiées : jamais en cache partagé
	if (event.locals.user) response.headers.set('Cache-Control', 'private, no-store');
	return response;
};
