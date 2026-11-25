/** Règles de mot de passe partagées client / serveur (maquette « Nouveau mot de passe »). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export type PasswordRules = { length: boolean; upper: boolean; digit: boolean };

export function checkPasswordRules(pwd: string): PasswordRules {
	return {
		length: pwd.length >= PASSWORD_MIN,
		upper: /\p{Lu}/u.test(pwd),
		digit: /\d/.test(pwd)
	};
}

export function isPasswordValid(pwd: string): boolean {
	const r = checkPasswordRules(pwd);
	return r.length && r.upper && r.digit && pwd.length <= PASSWORD_MAX;
}

/** Force 0..4 (4 barres de la maquette) : une barre par règle respectée, +1 si ≥ 12 caractères avec un symbole. */
export function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
	if (!pwd) return { score: 0, label: '' };
	const r = checkPasswordRules(pwd);
	let score = Number(r.length) + Number(r.upper) + Number(r.digit);
	if (score === 3 && pwd.length >= 12 && /[^\p{L}\d]/u.test(pwd)) score = 4;
	const s = Math.max(1, score) as 1 | 2 | 3 | 4;
	return { score: s, label: ['', 'faible', 'moyenne', 'bonne', 'forte'][s] };
}
