/**
 * Règles et formats partagés client / serveur (aucune dépendance serveur).
 */
export const PRIORITIES = ['MANDATORY', 'IF_POSSIBLE', 'IF_MONEY'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<
	Priority,
	{ label: string; cls: 'high' | 'mid' | 'low'; hint: string; rank: number }
> = {
	MANDATORY: { label: 'Haute', cls: 'high', hint: 'Je le veux au plus vite', rank: 0 },
	IF_POSSIBLE: { label: 'Moyenne', cls: 'mid', hint: 'Dans les prochains mois', rank: 1 },
	IF_MONEY: { label: 'Basse', cls: 'low', hint: 'Un jour, peut-être', rank: 2 }
};

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const int = new Intl.NumberFormat('fr-FR');

/** 10999 → « 109,99 € » */
export const formatPrice = (cents: number) => euro.format(cents / 100);
/** 8432 → « 8 432 » */
export const formatInt = (n: number) => int.format(n);
/** « 12 sets », « 0 set », « 1 set » */
export const formatSets = (n: number) => `${formatInt(n)} ${n > 1 ? 'sets' : 'set'}`;

/** Retiré = date de retrait dépassée. */
export function isRetired(
	removedFromStoreOn: Date | string | null | undefined,
	now = new Date()
): boolean {
	if (!removedFromStoreOn) return false;
	return new Date(removedFromStoreOn).getTime() <= now.getTime();
}

export function initials(username: string): string {
	const parts = username
		.replace(/[_\d]+/g, ' ')
		.trim()
		.split(/\s+|(?=[A-Z])/)
		.filter(Boolean);
	const s = (parts[0]?.[0] ?? username[0] ?? '?') + (parts[1]?.[0] ?? '');
	return s.toUpperCase();
}

// ---------------------------------------------------------------------
// Totaux (montants en centimes, entiers → pas d'erreur d'arrondi)
// ---------------------------------------------------------------------
type Priced = { priceCents: number; pieces: number };

export function collectionTotals(items: Priced[]) {
	let valueCents = 0;
	let pieces = 0;
	for (const i of items) {
		valueCents += i.priceCents;
		pieces += i.pieces;
	}
	return { count: items.length, valueCents, pieces };
}

export type WishSegment = 'all' | 'highMid' | 'high';
export const WISH_SEGMENTS: Record<WishSegment, Priority[]> = {
	all: ['MANDATORY', 'IF_POSSIBLE', 'IF_MONEY'],
	highMid: ['MANDATORY', 'IF_POSSIBLE'],
	high: ['MANDATORY']
};

export function wishlistTotals(items: { priority: Priority; priceCents: number }[]) {
	const out = {} as Record<WishSegment, { count: number; valueCents: number }>;
	for (const seg of Object.keys(WISH_SEGMENTS) as WishSegment[]) {
		const allowed = WISH_SEGMENTS[seg];
		const sel = items.filter((i) => allowed.includes(i.priority));
		out[seg] = { count: sel.length, valueCents: sel.reduce((a, i) => a + i.priceCents, 0) };
	}
	return out;
}
