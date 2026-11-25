import { fail, redirect } from '@sveltejs/kit';
import { processAvatar } from '$lib/server/avatar';
import { DomainError } from '$lib/server/errors';
import { rateLimit } from '$lib/server/rate-limit';
import { SESSION_COOKIE } from '$lib/server/auth/session';
import {
	deleteAccount,
	profileStats,
	removeAvatar,
	setAvatar,
	updateProfile
} from '$lib/server/services/profile';
import {
	deleteAccountSchema,
	fieldErrors,
	formToObject,
	profileSchema
} from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	stats: await profileStats(locals.user!.id)
});

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const user = locals.user!;
		const raw = formToObject(await request.formData());
		const values = { username: raw.username ?? '', email: raw.email ?? '' };
		const parsed = profileSchema.safeParse(raw);
		if (!parsed.success)
			return fail(400, { scope: 'update', values, errors: fieldErrors(parsed.error) });
		if (!(await rateLimit(`profile:${user.id}`, 10, 15 * 60 * 1000))) {
			return fail(429, {
				scope: 'update',
				values,
				errors: { form: 'Trop de tentatives. Réessaie dans quelques minutes.' } as Record<
					string,
					string
				>
			});
		}
		const errors = await updateProfile(user.id, parsed.data, locals.sessionToken);
		if (errors) return fail(400, { scope: 'update', values, errors });
		return { scope: 'update', saved: true };
	},

	avatar: async ({ request, locals }) => {
		const user = locals.user!;
		if (!(await rateLimit(`avatar:${user.id}`, 10, 60 * 60 * 1000)))
			return fail(429, {
				scope: 'avatar',
				message: 'Trop de changements d’avatar. Réessaie plus tard.'
			});
		// Refus précoce des corps trop gros (avant lecture complète)
		const len = Number(request.headers.get('content-length') ?? 0);
		if (len > 2.5 * 1024 * 1024)
			return fail(413, { scope: 'avatar', message: 'Image trop lourde (2 Mo maximum)' });
		const data = await request.formData();
		const file = data.get('avatar');
		if (data.get('remove') === '1') {
			await removeAvatar(user.id);
			return { scope: 'avatar', saved: true };
		}
		try {
			if (!(file instanceof File)) throw new DomainError(400, 'Aucune image reçue');
			const { data: bytes, mime } = await processAvatar(file);
			await setAvatar(user.id, bytes, mime);
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { scope: 'avatar', message: e.message });
			throw e;
		}
		return { scope: 'avatar', saved: true };
	},

	delete: async ({ request, locals, cookies }) => {
		const user = locals.user!;
		const parsed = deleteAccountSchema.safeParse(formToObject(await request.formData()));
		if (!parsed.success) return fail(400, { scope: 'delete', message: 'Mot de passe requis' });
		if (!(await rateLimit(`delete:${user.id}`, 5, 15 * 60 * 1000)))
			return fail(429, { scope: 'delete', message: 'Trop de tentatives.' });
		try {
			await deleteAccount(user.id, parsed.data.password);
		} catch (e) {
			if (e instanceof DomainError) return fail(e.status, { scope: 'delete', message: e.message });
			throw e;
		}
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
