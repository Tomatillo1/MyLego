import { z } from 'zod';
import { PASSWORD_MAX, isPasswordValid } from '$lib/rules/password';
import { PRIORITIES } from '$lib/domain';

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

const email = z
	.string()
	.trim()
	.toLowerCase()
	.max(254)
	.pipe(z.email({ message: 'Adresse email invalide' }));

const username = z.string().trim().regex(USERNAME_RE, '3 à 20 caractères : lettres, chiffres ou _');

const newPassword = z
	.string()
	.max(PASSWORD_MAX)
	.refine(isPasswordValid, '8 caractères minimum, une majuscule et un chiffre');

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Mot de passe requis').max(PASSWORD_MAX)
});

export const registerSchema = z
	.object({
		username,
		email,
		password: newPassword,
		confirm: z.string()
	})
	.refine((d) => d.password === d.confirm, {
		path: ['confirm'],
		message: 'Les mots de passe ne correspondent pas'
	});

export const forgotSchema = z.object({ email });

export const resetSchema = z
	.object({ password: newPassword, confirm: z.string() })
	.refine((d) => d.password === d.confirm, {
		path: ['confirm'],
		message: 'Les mots de passe ne correspondent pas'
	});

export const resetTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const profileSchema = z
	.object({
		username,
		email,
		currentPassword: z.string().max(PASSWORD_MAX).optional().default(''),
		newPassword: z
			.union([z.literal(''), newPassword])
			.optional()
			.default(''),
		confirm: z.string().optional().default('')
	})
	.refine((d) => d.newPassword === d.confirm, {
		path: ['confirm'],
		message: 'Les mots de passe ne correspondent pas'
	});

export const deleteAccountSchema = z.object({
	password: z.string().min(1, 'Mot de passe requis').max(PASSWORD_MAX)
});

export const legoIdSchema = z.object({ legoId: z.string().min(1).max(64) });
export const prioritySchema = z.enum(PRIORITIES);
export const wishSchema = z.object({ legoId: z.string().min(1).max(64), priority: prioritySchema });

// ---------------------------------------------------------------------
// Filtres (paramètres d'URL) — catalogue, collection, wishlist
// ---------------------------------------------------------------------
export const SORTS = [
	'relevance',
	'price_asc',
	'price_desc',
	'name_asc',
	'name_desc',
	'pieces_desc',
	'priority',
	'recent'
] as const;
export type Sort = (typeof SORTS)[number];
export const STATUSES = ['all', 'available', 'retired'] as const;
export type Status = (typeof STATUSES)[number];

const optInt = (max: number) =>
	z.preprocess(
		(v) => (v === '' || v == null ? undefined : v),
		z.coerce.number().int().min(0).max(max).optional()
	);

export const filterSchema = z.object({
	q: z.string().trim().max(80).optional().default(''),
	sort: z.enum(SORTS).optional().catch(undefined),
	themes: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
	pmin: optInt(100_000).catch(undefined), // euros
	pmax: optInt(100_000).catch(undefined),
	nmin: optInt(100_000).catch(undefined), // pièces
	nmax: optInt(100_000).catch(undefined),
	status: z.enum(STATUSES).catch('all').default('all')
});
export type Filters = z.infer<typeof filterSchema>;

export function parseFilters(params: URLSearchParams): Filters {
	const raw = {
		q: params.get('q') ?? undefined,
		sort: params.get('sort') ?? undefined,
		themes: params
			.getAll('themes')
			.flatMap((t) => t.split(','))
			.filter(Boolean),
		pmin: params.get('pmin') ?? undefined,
		pmax: params.get('pmax') ?? undefined,
		nmin: params.get('nmin') ?? undefined,
		nmax: params.get('nmax') ?? undefined,
		status: params.get('status') ?? undefined
	};
	const parsed = filterSchema.safeParse(raw);
	const f = parsed.success ? parsed.data : filterSchema.parse({});
	// Bornes inversées → on les remet dans l'ordre
	if (f.pmin != null && f.pmax != null && f.pmin > f.pmax) [f.pmin, f.pmax] = [f.pmax, f.pmin];
	if (f.nmin != null && f.nmax != null && f.nmin > f.nmax) [f.nmin, f.nmax] = [f.nmax, f.nmin];
	return f;
}

/** Transforme FormData en objet (les cases à cocher absentes restent undefined). */
export function formToObject(data: FormData): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of data) if (typeof v === 'string') out[k] = v;
	return out;
}

/** Premier message d'erreur par champ. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? 'form');
		out[key] ??= issue.message;
	}
	return out;
}
