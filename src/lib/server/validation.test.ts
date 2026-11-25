import { describe, expect, it } from 'vitest';
import {
	loginSchema,
	parseFilters,
	profileSchema,
	registerSchema,
	resetTokenSchema
} from './validation';

describe('validation des entrées', () => {
	it("normalise l'email (minuscules, espaces)", () => {
		const r = loginSchema.parse({ email: '  Toi@Exemple.FR ', password: 'x' });
		expect(r.email).toBe('toi@exemple.fr');
	});

	it('inscription : pseudo et confirmation obligatoires', () => {
		const ok = {
			username: 'BrickMaster',
			email: 'a@b.fr',
			password: 'Brique123',
			confirm: 'Brique123'
		};
		expect(registerSchema.safeParse(ok).success).toBe(true);
		expect(registerSchema.safeParse({ ...ok, username: 'ab' }).success).toBe(false);
		expect(registerSchema.safeParse({ ...ok, username: '<script>' }).success).toBe(false);
		expect(registerSchema.safeParse({ ...ok, confirm: 'Autre1234' }).success).toBe(false);
	});

	it('profil : mot de passe vide = pas de changement', () => {
		const r = profileSchema.parse({ username: 'Brick_Queen', email: 'a@b.fr' });
		expect(r.newPassword).toBe('');
	});

	it('jeton de réinitialisation : format strict', () => {
		expect(resetTokenSchema.safeParse('a'.repeat(43)).success).toBe(true);
		expect(resetTokenSchema.safeParse('../../etc').success).toBe(false);
	});

	it('filtres : valeurs invalides ignorées, bornes remises dans l’ordre', () => {
		const f = parseFilters(
			new URLSearchParams(
				'q=%20castle%20&sort=hack&themes=Icons&themes=Ideas&pmin=400&pmax=20&nmin=-5&status=nope'
			)
		);
		expect(f.q).toBe('castle');
		expect(f.sort).toBeUndefined();
		expect(f.themes).toEqual(['Icons', 'Ideas']);
		expect([f.pmin, f.pmax]).toEqual([20, 400]);
		expect(f.nmin).toBeUndefined();
		expect(f.status).toBe('all');
	});
});
