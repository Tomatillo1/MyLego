import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../../../test/fake-prisma';

const fake = vi.hoisted(() => ({
	db: null as unknown as ReturnType<typeof createFakePrisma>,
	links: [] as string[]
}));
vi.mock('$lib/server/prisma', async () => {
	const { createFakePrisma } = await import('../../../test/fake-prisma');
	fake.db = createFakePrisma();
	return { prisma: fake.db };
});
vi.mock('$lib/server/email', () => ({
	sendResetEmail: async (_to: string, link: string) => void fake.links.push(link)
}));

const { requestPasswordReset, consumePasswordReset, isResetTokenValid } = await import('./reset');
const { verifyPassword, hashPassword } = await import('./password');

const ORIGIN = 'https://mylego.test';
const t0 = new Date('2026-11-25T10:00:00Z');
const at = (s: number) => new Date(t0.getTime() + s * 1000);
const lastToken = () => fake.links.at(-1)!.split('/reset-password/')[1];

beforeEach(async () => {
	fake.db._reset();
	fake.links = [];
	await fake.db.user.create({
		data: {
			id: 'u1',
			email: 'toi@exemple.fr',
			username: 'Toi',
			passwordHash: await hashPassword('Ancien123')
		}
	});
	await fake.db.session.create({ data: { id: 's1', userId: 'u1', expiresAt: at(86400) } });
});

describe('réinitialisation du mot de passe', () => {
	it('email inconnu : aucun envoi, aucune erreur (pas de fuite d’existence)', async () => {
		await expect(requestPasswordReset('nobody@x.fr', ORIGIN, t0)).resolves.toBeUndefined();
		expect(fake.links).toHaveLength(0);
	});

	it('le jeton est stocké haché, jamais en clair', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		const stored = fake.db._db().passwordResetToken[0];
		expect(stored.tokenHash).not.toBe(lastToken());
		expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
	});

	it('usage unique : un 2e usage du même lien est refusé', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		const token = lastToken();
		expect(await consumePasswordReset(token, 'Nouveau123', at(60))).toBe(true);
		expect(await consumePasswordReset(token, 'Pirate123', at(70))).toBe(false);
		const u = fake.db._db().user[0];
		expect(await verifyPassword(u.passwordHash as string, 'Nouveau123')).toBe(true);
	});

	it('deux requêtes simultanées avec le même lien : une seule réussit', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		const token = lastToken();
		const results = await Promise.all([
			consumePasswordReset(token, 'Nouveau123', at(60)),
			consumePasswordReset(token, 'Autre1234', at(60))
		]);
		expect(results.filter(Boolean)).toHaveLength(1);
	});

	it('lien expiré après 30 minutes', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		const token = lastToken();
		expect(await isResetTokenValid(token, at(29 * 60))).toBe(true);
		expect(await isResetTokenValid(token, at(30 * 60))).toBe(false);
		expect(await consumePasswordReset(token, 'Nouveau123', at(31 * 60))).toBe(false);
	});

	it('jeton inconnu refusé', async () => {
		expect(await consumePasswordReset('x'.repeat(43), 'Nouveau123', t0)).toBe(false);
	});

	it('après réinitialisation : toutes les sessions sont fermées', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		await consumePasswordReset(lastToken(), 'Nouveau123', at(60));
		expect(fake.db._db().session).toHaveLength(0);
	});

	it('renvoi limité : rien avant 45 s, puis un nouveau lien qui invalide l’ancien', async () => {
		await requestPasswordReset('toi@exemple.fr', ORIGIN, t0);
		const first = lastToken();
		await requestPasswordReset('toi@exemple.fr', ORIGIN, at(30));
		expect(fake.links).toHaveLength(1);
		await requestPasswordReset('toi@exemple.fr', ORIGIN, at(46));
		expect(fake.links).toHaveLength(2);
		expect(await isResetTokenValid(first, at(50))).toBe(false);
		expect(await isResetTokenValid(lastToken(), at(50))).toBe(true);
	});

	it('plafond de 5 envois par heure', async () => {
		for (let i = 0; i < 8; i++) await requestPasswordReset('toi@exemple.fr', ORIGIN, at(i * 60));
		expect(fake.links).toHaveLength(5);
	});
});
