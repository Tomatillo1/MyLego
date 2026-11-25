import { setActions } from '$lib/server/set-actions';
import { catalogueFacets, listCatalogue } from '$lib/server/services/legos';
import { parseFilters } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = parseFilters(url.searchParams);
	const [legos, facets] = await Promise.all([
		listCatalogue(locals.user!.id, filters),
		catalogueFacets()
	]);
	return { filters, legos, facets };
};

export const actions: Actions = setActions;
