import { fail, redirect } from '@sveltejs/kit';
import { authenticate } from '$lib/server/auth/users';
import { createSession } from '$lib/server/auth/session';
import { rateLimit, resetRateLimit } from '$lib/server/rate-limit';
import { fieldErrors, formToObject, loginSchema } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	reset: url.searchParams.get('reset') === '1'
});

/** N'autorise qu'une redirection interne (pas d'open redirect). */
function safeNext(next: string | null): string {
	return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
		? next
		: '/catalogue';
}

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const raw = formToObject(await request.formData());
		const parsed = loginSchema.safeParse(raw);
		if (!parsed.success)
			return fail(400, { email: raw.email ?? '', errors: fieldErrors(parsed.error) });
		const { email, password } = parsed.data;

		const key = `login:${getClientAddress()}:${email}`;
		if (!(await rateLimit(key, 8, 15 * 60 * 1000))) {
			return fail(429, {
				email,
				errors: { form: 'Trop de tentatives. Réessaie dans quelques minutes.' } as Record<
					string,
					string
				>
			});
		}
		const userId = await authenticate(email, password);
		if (!userId)
			return fail(400, {
				email,
				errors: { form: 'Email ou mot de passe incorrect.' } as Record<string, string>
			});

		await resetRateLimit(key);
		await createSession(userId, cookies);
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
