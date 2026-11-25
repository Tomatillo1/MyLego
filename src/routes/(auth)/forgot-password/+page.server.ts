import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { requestPasswordReset, RESET_EMAIL_COOKIE } from '$lib/server/auth/reset';
import { rateLimit } from '$lib/server/rate-limit';
import { fieldErrors, forgotSchema, formToObject } from '$lib/server/validation';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const raw = formToObject(await request.formData());
		const parsed = forgotSchema.safeParse(raw);
		if (!parsed.success)
			return fail(400, { email: raw.email ?? '', errors: fieldErrors(parsed.error) });
		const { email } = parsed.data;

		// Même réponse que le compte existe ou non ; limites par IP et par compte (dans le service)
		if (await rateLimit(`forgot:${getClientAddress()}`, 10, 60 * 60 * 1000)) {
			await requestPasswordReset(email, url.origin);
		}
		cookies.set(RESET_EMAIL_COOKIE, email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 30 * 60
		});
		redirect(303, '/forgot-password/sent');
	}
};
