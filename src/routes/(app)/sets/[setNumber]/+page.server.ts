import { error } from '@sveltejs/kit';
import { setActions } from '$lib/server/set-actions';
import { getLegoForUser } from '$lib/server/services/legos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!/^[A-Za-z0-9-]{1,20}$/.test(params.setNumber)) error(404, 'Set introuvable');
	const lego = await getLegoForUser(locals.user!.id, params.setNumber);
	if (!lego) error(404, 'Set introuvable');
	return { lego };
};

export const actions: Actions = setActions;
