import { describe, expect, it } from 'vitest';
import { collectionTotals, formatPrice, isRetired, wishlistTotals } from './domain';

describe('calcul des totaux', () => {
	it('collection : somme exacte en centimes, nombre de sets et de pièces', () => {
		const t = collectionTotals([
			{ priceCents: 10999, pieces: 766 },
			{ priceCents: 7999, pieces: 1200 },
			{ priceCents: 8999, pieces: 6466 }
		]);
		expect(t).toEqual({ count: 3, valueCents: 27997, pieces: 8432 });
		expect(formatPrice(t.valueCents)).toBe('279,97 €');
	});

	it('collection vide : zéro partout', () => {
		expect(collectionTotals([])).toEqual({ count: 0, valueCents: 0, pieces: 0 });
	});

	it("pas d'erreur d'arrondi flottant (0,1 + 0,2)", () => {
		expect(
			collectionTotals([
				{ priceCents: 10, pieces: 0 },
				{ priceCents: 20, pieces: 0 }
			]).valueCents
		).toBe(30);
	});

	it('wishlist : 3 segments Toutes / Haute + Moyenne / Haute', () => {
		const t = wishlistTotals([
			{ priority: 'MANDATORY', priceCents: 39999 },
			{ priority: 'MANDATORY', priceCents: 9999 },
			{ priority: 'IF_POSSIBLE', priceCents: 22999 },
			{ priority: 'IF_POSSIBLE', priceCents: 6999 },
			{ priority: 'IF_MONEY', priceCents: 4999 },
			{ priority: 'IF_MONEY', priceCents: 12999 }
		]);
		// Valeurs de la maquette
		expect(t.all).toEqual({ count: 6, valueCents: 97994 });
		expect(t.highMid).toEqual({ count: 4, valueCents: 79996 });
		expect(t.high).toEqual({ count: 2, valueCents: 49998 });
	});

	it('wishlist vide', () => {
		const t = wishlistTotals([]);
		expect(t.all.count + t.highMid.count + t.high.count).toBe(0);
	});
});

describe('statut retiré', () => {
	const now = new Date('2026-11-25T12:00:00Z');
	it('date passée = retiré, date future = en vente, absente = en vente', () => {
		expect(isRetired(new Date('2025-07-31T12:00:00Z'), now)).toBe(true);
		expect(isRetired(new Date('2028-12-31T12:00:00Z'), now)).toBe(false);
		expect(isRetired(null, now)).toBe(false);
	});
});
