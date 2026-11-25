import { prisma } from '$lib/server/prisma';
import { isRetired, wishlistTotals, type Priority } from '$lib/domain';
import { conflict, notFound } from '$lib/server/errors';
import type { Filters } from '$lib/server/validation';
import { legoWhere, sortItems } from './filters';
import { legoSelect, type LegoView } from './legos';

/**
 * Ajoute (ou met à jour) un set dans la wishlist.
 * Règle d'exclusivité : refusé si le set est déjà dans la collection.
 */
export async function addToWishlist(
	userId: string,
	legoId: string,
	priority: Priority
): Promise<void> {
	await prisma.$transaction(async (tx) => {
		const lego = await tx.lego.findUnique({ where: { id: legoId }, select: { id: true } });
		if (!lego) throw notFound();
		const owned = await tx.collectionItem.findUnique({
			where: { userId_legoId: { userId, legoId } },
			select: { legoId: true }
		});
		if (owned) throw conflict('Ce set est déjà dans ta collection');
		await tx.wishlistItem.upsert({
			where: { userId_legoId: { userId, legoId } },
			create: { userId, legoId, priority },
			update: { priority }
		});
	});
}

/** Modifie la priorité d'un set de SA wishlist. */
export async function updateWishPriority(
	userId: string,
	legoId: string,
	priority: Priority
): Promise<void> {
	const { count } = await prisma.wishlistItem.updateMany({
		where: { userId, legoId },
		data: { priority }
	});
	if (count === 0) throw notFound("Ce set n'est pas dans ta wishlist");
}

export async function removeFromWishlist(userId: string, legoId: string): Promise<void> {
	await prisma.wishlistItem.deleteMany({ where: { userId, legoId } });
}

export async function listWishlist(userId: string, f: Filters, now = new Date()) {
	const [all, filtered] = await Promise.all([
		prisma.wishlistItem.findMany({
			where: { userId },
			select: { priority: true, lego: { select: { priceCents: true } } }
		}),
		prisma.wishlistItem.findMany({
			where: { userId, lego: legoWhere(f, now) },
			select: { priority: true, createdAt: true, lego: { select: legoSelect } }
		})
	]);
	const items: LegoView[] = filtered.map(({ priority, createdAt, lego }) => ({
		...lego,
		priority,
		addedAt: createdAt,
		retired: isRetired(lego.removedFromStoreOn, now),
		inCollection: false,
		wishPriority: priority
	}));
	return {
		totals: wishlistTotals(
			all.map((i) => ({ priority: i.priority, priceCents: i.lego.priceCents }))
		),
		items: sortItems(items, f.sort, f.q, 'priority')
	};
}

export async function navCounts(userId: string) {
	const [collection, wishlist] = await Promise.all([
		prisma.collectionItem.count({ where: { userId } }),
		prisma.wishlistItem.count({ where: { userId } })
	]);
	return { collection, wishlist };
}
