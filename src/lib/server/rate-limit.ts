/**
 * Limiteur en mémoire (fenêtre glissante simple). Suffisant pour une instance
 * unique ; à remplacer par un stockage partagé si l'app tourne sur plusieurs instances.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
	const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	if (list.length >= max) {
		hits.set(key, list);
		return false;
	}
	list.push(now);
	hits.set(key, list);
	if (hits.size > 10_000)
		for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
	return true;
}

export function resetRateLimit(key: string) {
	hits.delete(key);
}
