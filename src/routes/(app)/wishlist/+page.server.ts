import { setActions } from '$lib/server/set-actions';
import { catalogueFacets } from '$lib/server/services/legos';
import { listWishlist } from '$lib/server/services/wishlist';
import { parseFilters } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = parseFilters(url.searchParams);
	const [{ totals, items }, facets] = await Promise.all([
		listWishlist(locals.user!.id, filters),
		catalogueFacets()
	]);
	return { filters, totals, items, facets };
};

export const actions: Actions = {
	wish: setActions.wish,
	priority: setActions.priority,
	unwish: setActions.unwish
};
