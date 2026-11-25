/** Filtres côté client (même forme que le résultat de parseFilters côté serveur). */
export type FilterState = {
	q: string;
	sort?: string;
	themes: string[];
	pmin?: number;
	pmax?: number;
	nmin?: number;
	nmax?: number;
	status: 'all' | 'available' | 'retired';
};

export const SORT_LABELS: Record<string, string> = {
	relevance: 'Pertinence',
	price_asc: 'Prix croissant',
	price_desc: 'Prix décroissant',
	name_asc: 'A → Z',
	name_desc: 'Z → A',
	pieces_desc: 'Nb de pièces',
	priority: 'Priorité',
	recent: 'Ajout récent'
};

export const STATUS_LABELS = { all: 'Tous', available: 'Disponibles', retired: 'Retirés' } as const;

export function toSearch(f: FilterState): string {
	const p = new URLSearchParams();
	if (f.q) p.set('q', f.q);
	if (f.sort) p.set('sort', f.sort);
	for (const t of f.themes) p.append('themes', t);
	if (f.pmin != null) p.set('pmin', String(f.pmin));
	if (f.pmax != null) p.set('pmax', String(f.pmax));
	if (f.nmin != null) p.set('nmin', String(f.nmin));
	if (f.nmax != null) p.set('nmax', String(f.nmax));
	if (f.status !== 'all') p.set('status', f.status);
	const s = p.toString();
	return s ? `?${s}` : '';
}

export type Chip = { key: string; label: string; without: FilterState };

/** Chips des filtres actifs (hors recherche), chacune sachant se retirer. */
export function activeChips(f: FilterState, defaultSort: string): Chip[] {
	const chips: Chip[] = [];
	for (const t of f.themes)
		chips.push({
			key: `t:${t}`,
			label: t,
			without: { ...f, themes: f.themes.filter((x) => x !== t) }
		});
	if (f.pmin != null || f.pmax != null)
		chips.push({
			key: 'p',
			label: `${f.pmin ?? 0} € – ${f.pmax ?? '∞'} €`,
			without: { ...f, pmin: undefined, pmax: undefined }
		});
	if (f.nmin != null || f.nmax != null)
		chips.push({
			key: 'n',
			label: `${f.nmin ?? 0} – ${f.nmax ?? '∞'} pièces`,
			without: { ...f, nmin: undefined, nmax: undefined }
		});
	if (f.status !== 'all')
		chips.push({ key: 's', label: STATUS_LABELS[f.status], without: { ...f, status: 'all' } });
	if (f.sort && f.sort !== defaultSort)
		chips.push({
			key: 'o',
			label: SORT_LABELS[f.sort] ?? f.sort,
			without: { ...f, sort: undefined }
		});
	return chips;
}

/**
 * Applique des filtres à la page courante (seule la query string change).
 * `path` est une route déjà résolue (ex. resolve('/catalogue')).
 */
export function filtersHref(path: string, f: FilterState): string {
	return `${path}${toSearch(f)}`;
}
