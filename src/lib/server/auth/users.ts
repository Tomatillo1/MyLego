import { randomInt } from 'node:crypto';
import { prisma } from '$lib/server/prisma';
import { isUniqueViolation } from '$lib/server/errors';
import { burnPasswordCheck, hashPassword, verifyPassword } from './password';

/** Pseudo déjà pris ? (insensible à la casse) — `exceptUserId` pour l'édition du profil. */
export async function isUsernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
	const u = await prisma.user.findFirst({
		where: {
			username: { equals: username, mode: 'insensitive' },
			...(exceptUserId ? { NOT: { id: exceptUserId } } : {})
		},
		select: { id: true }
	});
	return !!u;
}

export async function isEmailTaken(email: string, exceptUserId?: string): Promise<boolean> {
	const u = await prisma.user.findFirst({
		where: { email, ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}) },
		select: { id: true }
	});
	return !!u;
}

/** Candidats « BrickMaster42 » : base tronquée + 2 chiffres. */
export function usernameCandidates(base: string, n = 6): string[] {
	const b = base.replace(/[^A-Za-z0-9_]/g, '').slice(0, 17) || 'brick';
	const set = new Set<string>();
	while (set.size < n) set.add(`${b}${randomInt(10, 1000)}`);
	return [...set];
}

export async function suggestUsername(base: string): Promise<string | null> {
	const candidates = usernameCandidates(base);
	const taken = await prisma.user.findMany({
		where: {
			OR: candidates.map((c) => ({ username: { equals: c, mode: 'insensitive' as const } }))
		},
		select: { username: true }
	});
	const t = new Set(taken.map((u) => u.username.toLowerCase()));
	return candidates.find((c) => !t.has(c.toLowerCase())) ?? null;
}

export type RegisterResult =
	| { ok: true; userId: string }
	| { ok: false; field: 'username' | 'email'; message: string; suggestion?: string | null };

export async function registerUser(input: {
	username: string;
	email: string;
	password: string;
}): Promise<RegisterResult> {
	if (await isUsernameTaken(input.username)) {
		return {
			ok: false,
			field: 'username',
			message: 'Ce pseudo est déjà pris.',
			suggestion: await suggestUsername(input.username)
		};
	}
	if (await isEmailTaken(input.email)) {
		return { ok: false, field: 'email', message: 'Un compte existe déjà avec cet email.' };
	}
	try {
		const user = await prisma.user.create({
			data: {
				username: input.username,
				email: input.email,
				passwordHash: await hashPassword(input.password)
			},
			select: { id: true }
		});
		return { ok: true, userId: user.id };
	} catch (e) {
		// Course entre deux inscriptions simultanées : l'index unique tranche.
		if (isUniqueViolation(e)) {
			const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? '');
			return target.includes('email')
				? { ok: false, field: 'email', message: 'Un compte existe déjà avec cet email.' }
				: {
						ok: false,
						field: 'username',
						message: 'Ce pseudo est déjà pris.',
						suggestion: await suggestUsername(input.username)
					};
		}
		throw e;
	}
}

/** Vérifie les identifiants. Temps constant que l'email existe ou non. */
export async function authenticate(email: string, password: string): Promise<string | null> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true, passwordHash: true }
	});
	if (!user) {
		await burnPasswordCheck(password);
		return null;
	}
	return (await verifyPassword(user.passwordHash, password)) ? user.id : null;
}
