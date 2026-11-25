import { error, json } from '@sveltejs/kit';
import { countCatalogue } from '$lib/server/services/legos';
import { parseFilters } from '$lib/server/validation';
import type { RequestHandler } from './$types';

/** Nombre de sets pour des filtres donnés (bouton « Voir N sets » du panneau). */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Non connecté');
	return json(
		{ count: await countCatalogue(parseFilters(url.searchParams)) },
		{ headers: { 'Cache-Control': 'private, no-store' } }
	);
};
