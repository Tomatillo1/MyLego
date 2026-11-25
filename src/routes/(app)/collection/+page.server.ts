import { setActions } from '$lib/server/set-actions';
import { listCollection } from '$lib/server/services/collection';
import { catalogueFacets } from '$lib/server/services/legos';
import { parseFilters } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = parseFilters(url.searchParams);
	const [{ totals, items }, facets] = await Promise.all([
		listCollection(locals.user!.id, filters),
		catalogueFacets()
	]);
	return { filters, totals, items, facets };
};

export const actions: Actions = { collect: setActions.collect, uncollect: setActions.uncollect };
