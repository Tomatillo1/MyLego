import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/profil');

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		await destroySession(locals.sessionToken, cookies);
		redirect(303, '/login');
	}
};
