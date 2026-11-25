import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isCronAuthorized } from '$lib/server/cron';
import { prisma } from '$lib/server/prisma';
import { purgeExpiredRateLimits } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

/**
 * Appelé une fois par jour par Vercel Cron (voir vercel.json) pour que le projet
 * Supabase gratuit ne soit pas mis en pause faute d'activité (pause après 7 jours).
 * Sans CRON_SECRET configuré, toute requête est refusée.
 */
export const GET: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request.headers.get('authorization'), env.CRON_SECRET)) {
		error(401, 'Non autorisé');
	}
	// Vraie lecture sur une table (pas un simple SELECT 1) pour compter comme activité.
	const sets = await prisma.lego.count();
	// Ménage : compteurs de tentatives expirés
	const purged = await purgeExpiredRateLimits();
	return json({ ok: true, sets, purged, at: new Date().toISOString() });
};
