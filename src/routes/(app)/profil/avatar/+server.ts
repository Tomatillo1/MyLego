import { error } from '@sveltejs/kit';
import { getAvatar } from '$lib/server/services/profile';
import type { RequestHandler } from './$types';

/** Avatar de l'utilisateur connecté uniquement (pas d'id dans l'URL → pas d'accès aux autres comptes). */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Non connecté');
	const a = await getAvatar(locals.user.id);
	if (!a?.avatar || !a.avatarMime) error(404, 'Pas d’avatar');
	return new Response(a.avatar, {
		headers: {
			'Content-Type': a.avatarMime,
			'Cache-Control': 'private, max-age=31536000, immutable', // l'URL change avec ?v=
			'Content-Security-Policy': "default-src 'none'",
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
