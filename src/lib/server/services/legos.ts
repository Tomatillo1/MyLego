import { prisma } from '$lib/server/prisma';
import { isRetired, type Priority } from '$lib/domain';
import type { Filters } from '$lib/server/validation';
import { legoWhere, sortItems } from './filters';

/** Champs d'un set exposés au client. */
export const legoSelect = {
	id: true,
	name: true,
	setNumber: true,
	theme: true,
	pieces: true,
	priceCents: true,
	imageUrl: true,
	year: true,
	minAge: true,
	removedFromStoreOn: true
} as const;

export type LegoView = {
	id: string;
	name: string;
	setNumber: string;
	theme: string;
	pieces: number;
	priceCents: number;
	imageUrl: string;
	year: number | null;
	minAge: number | null;
	removedFromStoreOn: Date | null;
	retired: boolean;
	inCollection: boolean;
	wishPriority: Priority | null;
	addedAt?: Date | null;
	priority?: Priority | null;
};

/** Catalogue filtré + état collection / wishlist de l'utilisateur. */
export async function listCatalogue(userId: string, f: Filters, now = new Date()) {
	const legos = await prisma.lego.findMany({
		where: legoWhere(f, now),
		select: {
			...legoSelect,
			collectionItems: { where: { userId }, select: { addedAt: true } },
			wishlistItems: { where: { userId }, select: { priority: true } }
		}
	});
	const views: LegoView[] = legos.map(({ collectionItems, wishlistItems, ...l }) => ({
		...l,
		retired: isRetired(l.removedFromStoreOn, now),
		inCollection: collectionItems.length > 0,
		wishPriority: wishlistItems[0]?.priority ?? null
	}));
	return sortItems(views, f.sort, f.q, 'name_asc');
}

export function countCatalogue(f: Filters, now = new Date()) {
	return prisma.lego.count({ where: legoWhere(f, now) });
}

/** Thèmes disponibles et bornes pour le panneau de filtres. */
export async function catalogueFacets() {
	const [themes, agg] = await Promise.all([
		prisma.lego.groupBy({ by: ['theme'], orderBy: { theme: 'asc' } }),
		prisma.lego.aggregate({
			_min: { priceCents: true, pieces: true },
			_max: { priceCents: true, pieces: true }
		})
	]);
	return {
		themes: themes.map((t) => t.theme),
		priceMax: Math.ceil((agg._max.priceCents ?? 0) / 100),
		piecesMax: agg._max.pieces ?? 0
	};
}

export async function getLegoForUser(
	userId: string,
	setNumber: string,
	now = new Date()
): Promise<LegoView | null> {
	const l = await prisma.lego.findUnique({
		where: { setNumber },
		select: {
			...legoSelect,
			collectionItems: { where: { userId }, select: { addedAt: true } },
			wishlistItems: { where: { userId }, select: { priority: true } }
		}
	});
	if (!l) return null;
	const { collectionItems, wishlistItems, ...rest } = l;
	return {
		...rest,
		retired: isRetired(rest.removedFromStoreOn, now),
		inCollection: collectionItems.length > 0,
		wishPriority: wishlistItems[0]?.priority ?? null
	};
}
