import { describe, expect, it } from 'vitest';
import { checkPasswordRules, isPasswordValid, passwordStrength } from './password';

describe('règles du mot de passe', () => {
	it('exige 8 caractères, une majuscule et un chiffre', () => {
		expect(isPasswordValid('Briques1')).toBe(true);
		expect(isPasswordValid('Briques')).toBe(false); // trop court, pas de chiffre
		expect(isPasswordValid('briques12')).toBe(false); // pas de majuscule
		expect(isPasswordValid('BRIQUESxx')).toBe(false); // pas de chiffre
		expect(checkPasswordRules('Briques')).toEqual({ length: false, upper: true, digit: false });
	});
	it('accepte les majuscules accentuées', () => {
		expect(isPasswordValid('Élégant12')).toBe(true);
	});
	it('refuse au-delà de 128 caractères', () => {
		expect(isPasswordValid('A1' + 'a'.repeat(127))).toBe(false);
	});
	it('force sur 4 barres', () => {
		expect(passwordStrength('').score).toBe(0);
		expect(passwordStrength('brique123').label).toBe('moyenne');
		expect(passwordStrength('Brique123').label).toBe('bonne');
		expect(passwordStrength('Brique123!long').label).toBe('forte');
	});
});
