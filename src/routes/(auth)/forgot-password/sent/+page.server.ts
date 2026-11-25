import { redirect } from '@sveltejs/kit';
import { requestPasswordReset, RESEND_DELAY_MS, RESET_EMAIL_COOKIE } from '$lib/server/auth/reset';
import { rateLimit } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ cookies }) => {
	const email = cookies.get(RESET_EMAIL_COOKIE);
	if (!email) redirect(303, '/forgot-password');
	return { email, resendDelay: RESEND_DELAY_MS / 1000 };
};

export const actions: Actions = {
	resend: async ({ cookies, url, getClientAddress }) => {
		const email = cookies.get(RESET_EMAIL_COOKIE);
		if (!email) redirect(303, '/forgot-password');
		// Le délai de 45 s et le plafond horaire sont appliqués côté serveur dans le service
		if (rateLimit(`forgot:${getClientAddress()}`, 10, 60 * 60 * 1000))
			await requestPasswordReset(email, url.origin);
		return { resent: true };
	}
};
