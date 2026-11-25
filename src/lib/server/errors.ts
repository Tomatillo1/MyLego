/** Erreurs métier, converties en réponses HTTP par les actions. */
export class DomainError extends Error {
	constructor(
		public status: 400 | 403 | 404 | 409 | 429,
		message: string
	) {
		super(message);
	}
}
export const notFound = (m = 'Set introuvable') => new DomainError(404, m);
export const conflict = (m: string) => new DomainError(409, m);

export function isUniqueViolation(e: unknown): boolean {
	return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';
}
