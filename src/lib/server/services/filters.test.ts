import { describe, expect, it } from 'vitest';
import { legoWhere, sortItems } from './filters';
import { parseFilters } from '$lib/server/validation';

const items = [
	{
		name: 'Château médiéval',
		setNumber: '10305',
		priceCents: 39999,
		pieces: 4514,
		priority: 'IF_POSSIBLE' as const
	},
	{
		name: 'Bateau pirate',
		setNumber: '10320',
		priceCents: 9999,
		pieces: 2500,
		priority: 'MANDATORY' as const
	},
	{ name: 'Arche', setNumber: '305', priceCents: 4999, pieces: 300, priority: 'IF_MONEY' as const }
];

describe('tri', () => {
	it('A → Z en français (accents ignorés)', () => {
		expect(sortItems(items, 'name_asc').map((i) => i.name)).toEqual([
			'Arche',
			'Bateau pirate',
			'Château médiéval'
		]);
	});
	it('prix décroissant', () => {
		expect(sortItems(items, 'price_desc').map((i) => i.setNumber)).toEqual([
			'10305',
			'10320',
			'305'
		]);
	});
	it('priorité : Haute puis Moyenne puis Basse', () => {
		expect(sortItems(items, 'priority').map((i) => i.priority)).toEqual([
			'MANDATORY',
			'IF_POSSIBLE',
			'IF_MONEY'
		]);
	});
	it('pertinence : n° exact en premier', () => {
		expect(sortItems(items, 'relevance', '305')[0].setNumber).toBe('305');
	});
});

describe('filtres → requête', () => {
	it('prix convertis en centimes, statut retiré relatif à la date du jour', () => {
		const now = new Date('2026-11-25T00:00:00Z');
		const w = legoWhere(parseFilters(new URLSearchParams('pmin=20&pmax=400&status=retired')), now);
		expect(w).toEqual({
			AND: [
				{ priceCents: { gte: 2000 } },
				{ priceCents: { lte: 40000 } },
				{ removedFromStoreOn: { lte: now } }
			]
		});
	});
	it('aucun filtre = aucune condition', () => {
		expect(legoWhere(parseFilters(new URLSearchParams()))).toEqual({});
	});
});
