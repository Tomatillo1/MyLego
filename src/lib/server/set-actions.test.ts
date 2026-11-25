import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { createFakePrisma } from '../../test/fake-prisma';

const fake = vi.hoisted(() => ({ db: null as unknown as ReturnType<typeof createFakePrisma> }));
vi.mock('$lib/server/prisma', async () => {
	const { createFakePrisma } = await import('../../test/fake-prisma');
	fake.db = createFakePrisma();
	return { prisma: fake.db };
});

const { setActions } = await import('./set-actions');

function event(userId: string | null, fields: Record<string, string>) {
	const body = new FormData();
	for (const [k, v] of Object.entries(fields)) body.set(k, v);
	return {
		locals: { user: userId ? { id: userId } : null },
		request: new Request('http://x/catalogue?/collect', { method: 'POST', body })
	} as unknown as RequestEvent;
}

beforeEach(async () => {
	fake.db._reset();
	await fake.db.lego.create({
		data: {
			id: 'l1',
			name: 'AT-AT',
			setNumber: '75313',
			theme: 'Star Wars',
			pieces: 6785,
			priceCents: 84999
		}
	});
});

describe('actions : identité serveur uniquement', () => {
	it("un userId envoyé dans le formulaire est ignoré : c'est la session qui fait foi", async () => {
		await setActions.collect(event('victim', { legoId: 'l1' }));
		await setActions.uncollect(event('attacker', { legoId: 'l1', userId: 'victim' }));
		expect(fake.db._db().collectionItem).toEqual([
			expect.objectContaining({ userId: 'victim', legoId: 'l1' })
		]);
	});

	it('non connecté : 401', async () => {
		await expect(setActions.collect(event(null, { legoId: 'l1' }))).rejects.toMatchObject({
			status: 401
		});
	});

	it('entrée invalide : 400 sans écriture', async () => {
		const r = await setActions.wish(event('u', { legoId: 'l1', priority: 'SUPER_HAUTE' }));
		expect(r).toMatchObject({ status: 400 });
		expect(fake.db._db().wishlistItem).toHaveLength(0);
	});
});
