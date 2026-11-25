import type { Prisma } from '../../../../generated/client';
import { PRIORITY_META, type Priority } from '$lib/domain';
import type { Filters, Sort } from '$lib/server/validation';

/** Filtres → clause Prisma sur Lego. */
export function legoWhere(f: Filters, now = new Date()): Prisma.LegoWhereInput {
	const and: Prisma.LegoWhereInput[] = [];
	if (f.q) {
		and.push({
			OR: [
				{ name: { contains: f.q, mode: 'insensitive' } },
				{ setNumber: { startsWith: f.q.replace(/^#/, '') } },
				{ theme: { contains: f.q, mode: 'insensitive' } }
			]
		});
	}
	if (f.themes.length) and.push({ theme: { in: f.themes } });
	if (f.pmin != null) and.push({ priceCents: { gte: f.pmin * 100 } });
	if (f.pmax != null) and.push({ priceCents: { lte: f.pmax * 100 } });
	if (f.nmin != null) and.push({ pieces: { gte: f.nmin } });
	if (f.nmax != null) and.push({ pieces: { lte: f.nmax } });
	if (f.status === 'retired') and.push({ removedFromStoreOn: { lte: now } });
	if (f.status === 'available')
		and.push({ OR: [{ removedFromStoreOn: null }, { removedFromStoreOn: { gt: now } }] });
	return and.length ? { AND: and } : {};
}

type Sortable = {
	name: string;
	setNumber: string;
	priceCents: number;
	pieces: number;
	priority?: Priority | null;
	addedAt?: Date | null;
};

const coll = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/** Tri en mémoire (stable). « relevance » met en tête les correspondances exactes de n° puis de nom. */
export function sortItems<T extends Sortable>(
	items: T[],
	sort: Sort | undefined,
	q = '',
	fallback: Sort = 'name_asc'
): T[] {
	const s = sort ?? (q ? 'relevance' : fallback);
	const byName = (a: T, b: T) => coll.compare(a.name, b.name);
	const out = [...items];
	switch (s) {
		case 'price_asc':
			return out.sort((a, b) => a.priceCents - b.priceCents || byName(a, b));
		case 'price_desc':
			return out.sort((a, b) => b.priceCents - a.priceCents || byName(a, b));
		case 'name_desc':
			return out.sort((a, b) => -byName(a, b));
		case 'pieces_desc':
			return out.sort((a, b) => b.pieces - a.pieces || byName(a, b));
		case 'priority':
			return out.sort(
				(a, b) => rank(a.priority) - rank(b.priority) || b.priceCents - a.priceCents || byName(a, b)
			);
		case 'recent':
			return out.sort(
				(a, b) => (b.addedAt?.getTime() ?? 0) - (a.addedAt?.getTime() ?? 0) || byName(a, b)
			);
		case 'relevance': {
			const ql = q.toLowerCase().replace(/^#/, '');
			const score = (i: T) =>
				!ql
					? 3
					: i.setNumber === ql
						? 0
						: i.name.toLowerCase().startsWith(ql)
							? 1
							: i.setNumber.startsWith(ql)
								? 1
								: 2;
			return out.sort((a, b) => score(a) - score(b) || byName(a, b));
		}
		default:
			return out.sort(byName);
	}
}
const rank = (p?: Priority | null) => (p ? PRIORITY_META[p].rank : 9);
