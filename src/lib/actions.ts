import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ActionResult } from '@sveltejs/kit';

/**
 * Appelle une form action SvelteKit de la page courante (ex. « ?/collect »)
 * hors d'un <form>, puis recharge les données. Le serveur identifie
 * l'utilisateur par sa session : aucun id utilisateur n'est envoyé.
 */
export async function callAction(
	action: string,
	data: Record<string, string>
): Promise<ActionResult> {
	const body = new FormData();
	for (const [k, v] of Object.entries(data)) body.set(k, v);
	let result: ActionResult;
	try {
		const res = await fetch(action, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		result = deserialize(await res.text());
	} catch {
		result = { type: 'failure', status: 0, data: { message: 'Connexion impossible. Réessaie.' } };
	}
	if (result.type === 'redirect') location.href = result.location;
	await invalidateAll();
	return result;
}

export function failureMessage(r: ActionResult): string | null {
	if (r.type === 'failure') return (r.data?.message as string) ?? 'Une erreur est survenue';
	if (r.type === 'error') return 'Une erreur est survenue';
	return null;
}
