import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../../../test/fake-prisma';

const fake = vi.hoisted(() => ({ db: null as unknown as ReturnType<typeof createFakePrisma> }));
vi.mock('$lib/server/prisma', async () => {
	const { createFakePrisma } = await import('../../../test/fake-prisma');
	fake.db = createFakePrisma();
	return { prisma: fake.db };
});

const { registerUser, authenticate, usernameCandidates } = await import('./users');

beforeEach(() => fake.db._reset());

describe('inscription : unicité', () => {
	it('pseudo déjà pris (insensible à la casse) → erreur + suggestion libre', async () => {
		await registerUser({ username: 'BrickMaster', email: 'a@b.fr', password: 'Brique123' });
		const r = await registerUser({
			username: 'brickmaster',
			email: 'c@d.fr',
			password: 'Brique123'
		});
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.field).toBe('username');
			expect(r.suggestion).toMatch(/^brickmaster\d{2,3}$/);
		}
	});

	it('email déjà utilisé → erreur sur le champ email', async () => {
		await registerUser({ username: 'Un', email: 'a@b.fr', password: 'Brique123' });
		const r = await registerUser({ username: 'Deux', email: 'a@b.fr', password: 'Brique123' });
		expect(r).toMatchObject({ ok: false, field: 'email' });
	});

	it('course entre deux inscriptions : la contrainte unique tranche (P2002)', async () => {
		const [r1, r2] = await Promise.all([
			registerUser({ username: 'Same', email: 'x@y.fr', password: 'Brique123' }),
			registerUser({ username: 'Same', email: 'z@y.fr', password: 'Brique123' })
		]);
		expect([r1.ok, r2.ok].filter(Boolean)).toHaveLength(1);
		expect(fake.db._db().user).toHaveLength(1);
	});

	it('le mot de passe est haché (argon2id), jamais stocké en clair', async () => {
		await registerUser({ username: 'Hash', email: 'h@h.fr', password: 'Brique123' });
		const u = fake.db._db().user[0];
		expect(u.passwordHash).toMatch(/^\$argon2id\$/);
		expect(await authenticate('h@h.fr', 'Brique123')).toBe(u.id);
		expect(await authenticate('h@h.fr', 'mauvais')).toBeNull();
		expect(await authenticate('inconnu@h.fr', 'Brique123')).toBeNull();
	});

	it('suggestions de pseudo valides (lettres, chiffres, _ ; ≤ 20)', () => {
		for (const c of usernameCandidates('Brick Master!!_TrèsLongPseudo'))
			expect(c).toMatch(/^[A-Za-z0-9_]{3,20}$/);
	});
});
