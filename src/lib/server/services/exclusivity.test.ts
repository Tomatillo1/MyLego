import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../../../test/fake-prisma';

const fake = vi.hoisted(() => ({ db: null as unknown as ReturnType<typeof createFakePrisma> }));
vi.mock('$lib/server/prisma', async () => {
	const { createFakePrisma } = await import('../../../test/fake-prisma');
	fake.db = createFakePrisma();
	return { prisma: fake.db };
});

const { addToCollection, removeFromCollection, undoAddToCollection } = await import('./collection');
const { addToWishlist, removeFromWishlist, updateWishPriority } = await import('./wishlist');

const A = 'user_A';
const B = 'user_B';
const LEGO = 'lego_1';

beforeEach(async () => {
	fake.db._reset();
	await fake.db.lego.create({
		data: {
			id: LEGO,
			name: 'Black Pearl',
			setNumber: '10315',
			theme: 'Icons',
			pieces: 2500,
			priceCents: 35000
		}
	});
});

const inCollection = (u: string) =>
	fake.db._db().collectionItem.some((r) => r.userId === u && r.legoId === LEGO);
const wishOf = (u: string) =>
	fake.db._db().wishlistItem.find((r) => r.userId === u && r.legoId === LEGO);

describe('exclusivité collection / wishlist', () => {
	it("ajouter à la collection retire de la wishlist et renvoie l'ancienne priorité", async () => {
		await addToWishlist(A, LEGO, 'IF_POSSIBLE');
		const r = await addToCollection(A, LEGO);
		expect(r.removedPriority).toBe('IF_POSSIBLE');
		expect(inCollection(A)).toBe(true);
		expect(wishOf(A)).toBeUndefined();
	});

	it('ajouter à la wishlist un set déjà possédé est refusé (409)', async () => {
		await addToCollection(A, LEGO);
		await expect(addToWishlist(A, LEGO, 'MANDATORY')).rejects.toMatchObject({ status: 409 });
		expect(wishOf(A)).toBeUndefined();
	});

	it('« Annuler » restaure la wishlist et retire de la collection, sans jamais avoir les deux', async () => {
		await addToWishlist(A, LEGO, 'IF_MONEY');
		const { removedPriority } = await addToCollection(A, LEGO);
		await undoAddToCollection(A, LEGO, removedPriority);
		expect(inCollection(A)).toBe(false);
		expect(wishOf(A)?.priority).toBe('IF_MONEY');
	});

	it("l'exclusivité est propre à chaque utilisateur", async () => {
		await addToCollection(A, LEGO);
		await addToWishlist(B, LEGO, 'MANDATORY');
		expect(inCollection(A)).toBe(true);
		expect(wishOf(B)).toBeDefined();
	});

	it('set inexistant : 404 et aucune écriture', async () => {
		await expect(addToCollection(A, 'nope')).rejects.toMatchObject({ status: 404 });
		await expect(addToWishlist(A, 'nope', 'MANDATORY')).rejects.toMatchObject({ status: 404 });
		expect(fake.db._db().collectionItem).toHaveLength(0);
		expect(fake.db._db().wishlistItem).toHaveLength(0);
	});
});

describe('unicité', () => {
	it('ajouter deux fois à la collection ne crée pas de doublon', async () => {
		await addToCollection(A, LEGO);
		await addToCollection(A, LEGO);
		expect(fake.db._db().collectionItem).toHaveLength(1);
	});

	it('ajouter deux fois à la wishlist met à jour la priorité sans doublon', async () => {
		await addToWishlist(A, LEGO, 'IF_MONEY');
		await addToWishlist(A, LEGO, 'MANDATORY');
		expect(fake.db._db().wishlistItem).toHaveLength(1);
		expect(wishOf(A)?.priority).toBe('MANDATORY');
	});
});

describe('chacun ne modifie que ses propres données', () => {
	it('B ne peut ni retirer ni modifier les sets de A', async () => {
		await addToCollection(A, LEGO);
		await removeFromCollection(B, LEGO);
		expect(inCollection(A)).toBe(true);

		await removeFromCollection(A, LEGO);
		await addToWishlist(A, LEGO, 'IF_MONEY');
		await expect(updateWishPriority(B, LEGO, 'MANDATORY')).rejects.toMatchObject({ status: 404 });
		await removeFromWishlist(B, LEGO);
		expect(wishOf(A)?.priority).toBe('IF_MONEY');
	});
});
