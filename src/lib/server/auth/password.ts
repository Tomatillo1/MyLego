import { hash, verify } from '@node-rs/argon2';

/** Paramètres argon2id (recommandations OWASP). */
export const ARGON2_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1,
	outputLen: 32
} as const;

export function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON2_OPTIONS);
}

/** Retourne false (sans lever) si le hash stocké est invalide ou ancien format. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	if (!passwordHash.startsWith('$argon2')) return false;
	try {
		return await verify(passwordHash, password);
	} catch {
		return false;
	}
}

/** Hash factice pour garder un temps de réponse constant quand l'email est inconnu. */
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string): Promise<void> {
	dummyHash ??= hashPassword('dummy-password-for-timing');
	await verifyPassword(await dummyHash, password);
}
