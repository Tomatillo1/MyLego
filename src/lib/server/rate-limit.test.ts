import { describe, expect, it, vi } from 'vitest';

vi.mock('./prisma', () => ({ prisma: {} }));
const { memoryStore, rateLimit, resetRateLimit } = await import('./rate-limit');

describe('limitation des tentatives', () => {
	it('autorise `max` tentatives puis bloque jusqu’à la fin de la fenêtre', async () => {
		let t = 0;
		const store = memoryStore(() => t);
		for (let i = 0; i < 3; i++) expect(await rateLimit('login:a', 3, 1000, store)).toBe(true);
		expect(await rateLimit('login:a', 3, 1000, store)).toBe(false);
		t = 999;
		expect(await rateLimit('login:a', 3, 1000, store)).toBe(false);
		t = 1000;
		expect(await rateLimit('login:a', 3, 1000, store)).toBe(true);
	});

	it('les clés sont indépendantes et reset remet à zéro', async () => {
		const store = memoryStore(() => 0);
		expect(await rateLimit('k1', 1, 1000, store)).toBe(true);
		expect(await rateLimit('k1', 1, 1000, store)).toBe(false);
		expect(await rateLimit('k2', 1, 1000, store)).toBe(true);
		await resetRateLimit('k1', store);
		expect(await rateLimit('k1', 1, 1000, store)).toBe(true);
	});

	it('laisse passer si le stockage est indisponible', async () => {
		const broken = {
			hit: () => Promise.reject(new Error('db down')),
			reset: () => Promise.reject(new Error('db down'))
		};
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(await rateLimit('k', 1, 1000, broken)).toBe(true);
		await expect(resetRateLimit('k', broken)).resolves.toBeUndefined();
	});
});
