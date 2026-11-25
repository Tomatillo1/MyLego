import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Ancienne URL conservée : redirection permanente vers le catalogue. */
export const load: PageServerLoad = () => {
	redirect(301, '/catalogue');
};
