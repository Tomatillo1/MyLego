import { fail, redirect } from '@sveltejs/kit';
import { consumePasswordReset, isResetTokenValid } from '$lib/server/auth/reset';
import { destroySession } from '$lib/server/auth/session';
import { fieldErrors, formToObject, resetSchema, resetTokenSchema } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	// Le jeton est dans l'URL : on évite qu'il fuite via Referer ou cache
	setHeaders({ 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' });
	const ok =
		resetTokenSchema.safeParse(params.token).success && (await isResetTokenValid(params.token));
	return { valid: ok };
};

export const actions: Actions = {
	default: async ({ request, params, cookies, locals }) => {
		if (!resetTokenSchema.safeParse(params.token).success)
			return fail(400, { errors: { form: 'Lien invalide ou expiré.' } as Record<string, string> });
		const parsed = resetSchema.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });

		const ok = await consumePasswordReset(params.token, parsed.data.password);
		if (!ok)
			return fail(400, {
				errors: {
					form: 'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.'
				} as Record<string, string>
			});

		// Toutes les sessions ont été fermées : on nettoie aussi le cookie local
		await destroySession(locals.sessionToken, cookies);
		redirect(303, '/login?reset=1');
	}
};
