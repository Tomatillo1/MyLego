/**
 * Form actions partagées par le catalogue, la collection, la wishlist et la fiche set.
 * L'utilisateur vient TOUJOURS de la session (locals.user), jamais du formulaire.
 */
import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { DomainError } from '$lib/server/errors';
import { formToObject, legoIdSchema, prioritySchema, wishSchema } from '$lib/server/validation';
import {
	addToCollection,
	removeFromCollection,
	undoAddToCollection
} from '$lib/server/services/collection';
import {
	addToWishlist,
	removeFromWishlist,
	updateWishPriority
} from '$lib/server/services/wishlist';

async function run<T>(
	event: RequestEvent,
	fn: (userId: string, data: Record<string, string>) => Promise<T>
) {
	const user = event.locals.user;
	if (!user) error(401, 'Non connecté');
	const data = formToObject(await event.request.formData());
	try {
		return await fn(user.id, data);
	} catch (e) {
		if (e instanceof DomainError) return fail(e.status, { message: e.message });
		throw e;
	}
}

const bad = () => fail(400, { message: 'Requête invalide' });

export const setActions = {
	collect: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = legoIdSchema.safeParse(d);
			if (!p.success) return bad();
			const r = await addToCollection(userId, p.data.legoId);
			return {
				action: 'collect' as const,
				legoId: p.data.legoId,
				removedPriority: r.removedPriority
			};
		}),
	uncollect: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = legoIdSchema.safeParse(d);
			if (!p.success) return bad();
			await removeFromCollection(userId, p.data.legoId);
			return { action: 'uncollect' as const };
		}),
	undoCollect: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = legoIdSchema.safeParse(d);
			const prio = d.priority ? prioritySchema.safeParse(d.priority) : null;
			if (!p.success || (prio && !prio.success)) return bad();
			await undoAddToCollection(userId, p.data.legoId, prio?.success ? prio.data : null);
			return { action: 'undoCollect' as const };
		}),
	wish: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = wishSchema.safeParse(d);
			if (!p.success) return bad();
			await addToWishlist(userId, p.data.legoId, p.data.priority);
			return { action: 'wish' as const };
		}),
	priority: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = wishSchema.safeParse(d);
			if (!p.success) return bad();
			await updateWishPriority(userId, p.data.legoId, p.data.priority);
			return { action: 'priority' as const };
		}),
	unwish: (e: RequestEvent) =>
		run(e, async (userId, d) => {
			const p = legoIdSchema.safeParse(d);
			if (!p.success) return bad();
			await removeFromWishlist(userId, p.data.legoId);
			return { action: 'unwish' as const };
		})
};
