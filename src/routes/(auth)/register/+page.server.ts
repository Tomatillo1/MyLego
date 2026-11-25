import { fail, redirect } from '@sveltejs/kit';
import { registerUser } from '$lib/server/auth/users';
import { createSession } from '$lib/server/auth/session';
import { rateLimit } from '$lib/server/rate-limit';
import { fieldErrors, formToObject, registerSchema } from '$lib/server/validation';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const raw = formToObject(await request.formData());
		const values = { username: raw.username ?? '', email: raw.email ?? '' };
		if (!(await rateLimit(`register:${getClientAddress()}`, 10, 60 * 60 * 1000))) {
			return fail(429, {
				values,
				errors: { form: 'Trop de créations de compte. Réessaie plus tard.' } as Record<
					string,
					string
				>,
				suggestion: null
			});
		}
		const parsed = registerSchema.safeParse(raw);
		if (!parsed.success)
			return fail(400, { values, errors: fieldErrors(parsed.error), suggestion: null });

		const res = await registerUser(parsed.data);
		if (!res.ok)
			return fail(409, {
				values,
				errors: { [res.field]: res.message } as Record<string, string>,
				suggestion: res.suggestion ?? null
			});

		await createSession(res.userId, cookies);
		redirect(303, '/catalogue');
	}
};
