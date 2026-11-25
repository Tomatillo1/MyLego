import { timingSafeEqual } from 'node:crypto';

/** Vérifie l'en-tête « Authorization: Bearer <secret> » envoyé par Vercel Cron (comparaison à temps constant). */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
	if (!secret || !header) return false;
	const a = Buffer.from(header);
	const b = Buffer.from(`Bearer ${secret}`);
	return a.length === b.length && timingSafeEqual(a, b);
}
