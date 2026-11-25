import { prisma } from './prisma';

/**
 * Stockage des compteurs. En production : la table "RateLimit" (partagée entre toutes
 * les instances Vercel, contrairement à la mémoire). Injectable pour les tests.
 */
export type RateLimitStore = {
	/** Incrémente atomiquement le compteur de `key` et renvoie la nouvelle valeur. */
	hit(key: string, windowMs: number): Promise<number>;
	reset(key: string): Promise<void>;
};

export const dbStore: RateLimitStore = {
	async hit(key, windowMs) {
		// Un seul ordre SQL : sûr même si deux requêtes arrivent en même temps.
		// Fenêtre expirée → on repart à 1 avec une nouvelle échéance.
		const rows = await prisma.$queryRaw<{ count: number }[]>`
			INSERT INTO "RateLimit" ("key", "count", "resetAt")
			VALUES (${key}, 1, now() + ${windowMs} * interval '1 millisecond')
			ON CONFLICT ("key") DO UPDATE SET
				"count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
				"resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
			RETURNING "count"`;
		return Number(rows[0].count);
	},
	async reset(key) {
		await prisma.rateLimit.deleteMany({ where: { key } });
	}
};

/** Compteurs en mémoire, mêmes règles que la base (tests unitaires). */
export function memoryStore(now: () => number = Date.now): RateLimitStore {
	const m = new Map<string, { count: number; resetAt: number }>();
	return {
		async hit(key, windowMs) {
			const t = now();
			const cur = m.get(key);
			const next =
				!cur || cur.resetAt <= t
					? { count: 1, resetAt: t + windowMs }
					: { count: cur.count + 1, resetAt: cur.resetAt };
			m.set(key, next);
			return next.count;
		},
		async reset(key) {
			m.delete(key);
		}
	};
}

/**
 * Enregistre une tentative et renvoie `true` si elle est autorisée (au plus `max` par fenêtre).
 * Si la base est injoignable, on laisse passer (l'action échouera de toute façon sans base).
 */
export async function rateLimit(
	key: string,
	max: number,
	windowMs: number,
	store: RateLimitStore = dbStore
): Promise<boolean> {
	try {
		return (await store.hit(key, windowMs)) <= max;
	} catch (e) {
		console.error('[rate-limit] indisponible :', e);
		return true;
	}
}

export async function resetRateLimit(key: string, store: RateLimitStore = dbStore) {
	try {
		await store.reset(key);
	} catch (e) {
		console.error('[rate-limit] reset impossible :', e);
	}
}

/** Supprime les compteurs expirés (appelé par le cron quotidien). */
export async function purgeExpiredRateLimits(): Promise<number> {
	const { count } = await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
	return count;
}
