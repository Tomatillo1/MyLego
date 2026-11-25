import { prisma } from '$lib/server/prisma';
import { collectionTotals, isRetired, type Priority } from '$lib/domain';
import { notFound } from '$lib/server/errors';
import type { Filters } from '$lib/server/validation';
import { legoWhere, sortItems } from './filters';
import { legoSelect, type LegoView } from './legos';

/**
 * Ajoute un set à la collection. Règle d'exclusivité : s'il était dans la
 * wishlist, il en est retiré dans la même transaction. Retourne l'ancienne
 * priorité (pour le bouton « Annuler » du toast).
 */
export async function addToCollection(
	userId: string,
	legoId: string
): Promise<{ removedPriority: Priority | null }> {
	return prisma.$transaction(async (tx) => {
		const lego = await tx.lego.findUnique({ where: { id: legoId }, select: { id: true } });
		if (!lego) throw notFound();
		await tx.collectionItem.upsert({
			where: { userId_legoId: { userId, legoId } },
			create: { userId, legoId },
			update: {}
		});
		const wish = await tx.wishlistItem.findUnique({
			where: { userId_legoId: { userId, legoId } },
			select: { priority: true }
		});
		if (wish) await tx.wishlistItem.delete({ where: { userId_legoId: { userId, legoId } } });
		return { removedPriority: wish?.priority ?? null };
	});
}

/** Retire un set de la collection de l'utilisateur (idempotent). */
export async function removeFromCollection(userId: string, legoId: string): Promise<void> {
	await prisma.collectionItem.deleteMany({ where: { userId, legoId } });
}

/** Annule un « ajout en collection » : retire de la collection et restaure la wishlist. */
export async function undoAddToCollection(
	userId: string,
	legoId: string,
	priority: Priority | null
): Promise<void> {
	await prisma.$transaction(async (tx) => {
		await tx.collectionItem.deleteMany({ where: { userId, legoId } });
		if (priority) {
			await tx.wishlistItem.upsert({
				where: { userId_legoId: { userId, legoId } },
				create: { userId, legoId, priority },
				update: { priority }
			});
		}
	});
}

export async function listCollection(userId: string, f: Filters, now = new Date()) {
	const [all, filtered] = await Promise.all([
		prisma.collectionItem.findMany({
			where: { userId },
			select: { lego: { select: { priceCents: true, pieces: true } } }
		}),
		prisma.collectionItem.findMany({
			where: { userId, lego: legoWhere(f, now) },
			select: { addedAt: true, lego: { select: legoSelect } }
		})
	]);
	const items: LegoView[] = filtered.map(({ addedAt, lego }) => ({
		...lego,
		addedAt,
		retired: isRetired(lego.removedFromStoreOn, now),
		inCollection: true,
		wishPriority: null
	}));
	return {
		totals: collectionTotals(all.map((i) => i.lego)),
		items: sortItems(items, f.sort, f.q, 'name_asc')
	};
}
