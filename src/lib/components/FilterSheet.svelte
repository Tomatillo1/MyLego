<script lang="ts">
	import { formatSets } from '$lib/domain';
	import { SORT_LABELS, STATUS_LABELS, toSearch, type FilterState } from '$lib/filters';
	import Sheet from './Sheet.svelte';
	import DualRange from './DualRange.svelte';

	type Props = {
		open: boolean;
		filters: FilterState;
		facets: { themes: string[]; priceMax: number; piecesMax: number };
		sorts: string[];
		defaultSort: string;
		/** URL qui renvoie { count } pour un jeu de filtres (catalogue) */
		countUrl?: string;
		onapply: (f: FilterState) => void;
		onclose: () => void;
	};
	let { open, filters, facets, sorts, defaultSort, countUrl, onapply, onclose }: Props = $props();

	// Bornes fixes (1000 € / 12000 pièces), élargies seulement si un set les dépasse.
	// En butée haute, le filtre est désactivé (« 1000+ »).
	const PRICE_MAX = $derived(Math.max(1000, Math.ceil(facets.priceMax / 10) * 10));
	const PIECES_MAX = $derived(Math.max(12000, Math.ceil(facets.piecesMax / 500) * 500));

	let sort = $state('');
	let themes = $state<string[]>([]);
	let pmin = $state(0);
	let pmax = $state(0);
	let nmin = $state(0);
	let nmax = $state(0);
	let status = $state<FilterState['status']>('all');
	let count = $state<number | null>(null);

	$effect(() => {
		if (!open) return;
		sort = filters.sort ?? defaultSort;
		themes = [...filters.themes];
		pmin = filters.pmin ?? 0;
		pmax = filters.pmax ?? PRICE_MAX;
		nmin = filters.nmin ?? 0;
		nmax = filters.nmax ?? PIECES_MAX;
		status = filters.status;
	});

	const draft = $derived<FilterState>({
		q: filters.q,
		sort: sort === defaultSort ? undefined : sort,
		themes,
		pmin: pmin > 0 ? pmin : undefined,
		pmax: pmax < PRICE_MAX ? pmax : undefined,
		nmin: nmin > 0 ? nmin : undefined,
		nmax: nmax < PIECES_MAX ? nmax : undefined,
		status
	});

	// Nombre de résultats en direct (catalogue), avec anti-rebond
	$effect(() => {
		if (!open || !countUrl) return;
		const qs = toSearch(draft);
		const ctrl = new AbortController();
		const t = setTimeout(async () => {
			try {
				const res = await fetch(`${countUrl}${qs}`, { signal: ctrl.signal });
				if (res.ok) count = (await res.json()).count;
			} catch {
				/* hors ligne ou annulé */
			}
		}, 200);
		return () => (clearTimeout(t), ctrl.abort());
	});

	function reset() {
		sort = defaultSort;
		themes = [];
		pmin = 0;
		pmax = PRICE_MAX;
		nmin = 0;
		nmax = PIECES_MAX;
		status = 'all';
	}
	const clamp = (v: number, lo: number, hi: number) =>
		Math.min(hi, Math.max(lo, Number.isFinite(v) ? Math.round(v) : lo));
</script>

<Sheet {open} label="Filtrer et trier" {onclose}>
	<div class="sheet-head">
		<h3>Filtrer &amp; trier</h3>
		<button class="link-btn" type="button" onclick={reset}>Réinitialiser</button>
	</div>

	<div class="sheet-sec">
		<div class="sheet-label">Trier par</div>
		<div class="opts">
			{#each sorts as s (s)}
				<label class="opt"
					><input type="radio" name="sort" value={s} bind:group={sort} /><span
						>{SORT_LABELS[s]}</span
					></label
				>
			{/each}
		</div>
	</div>

	{#if facets.themes.length}
		<div class="sheet-sec">
			<div class="sheet-label">
				Thèmes {#if themes.length}<em>{themes.length} sélectionné{themes.length > 1 ? 's' : ''}</em
					>{/if}
			</div>
			<div class="opts">
				{#each facets.themes as t (t)}
					<label class="opt"
						><input type="checkbox" value={t} bind:group={themes} /><span>{t}</span></label
					>
				{/each}
			</div>
		</div>
	{/if}

	<div class="sheet-sec">
		<div class="sheet-label">Prix <em>{pmin} € – {pmax}{pmax >= PRICE_MAX ? '+' : ''} €</em></div>
		<div class="range-box">
			<label class="input"
				><input
					type="number"
					inputmode="numeric"
					min="0"
					max={PRICE_MAX}
					bind:value={pmin}
					onchange={() => (pmin = clamp(pmin, 0, pmax))}
					aria-label="Prix minimum"
				/><span class="unit">€</span></label
			>
			<span class="dash">—</span>
			<label class="input"
				><input
					type="number"
					inputmode="numeric"
					min="0"
					max={PRICE_MAX}
					bind:value={pmax}
					onchange={() => (pmax = clamp(pmax, pmin, PRICE_MAX))}
					aria-label="Prix maximum"
				/><span class="unit">€</span></label
			>
		</div>
		<DualRange min={0} max={PRICE_MAX} step={5} bind:low={pmin} bind:high={pmax} label="Prix" />
	</div>

	<div class="sheet-sec">
		<div class="sheet-label">
			Nombre de pièces <em>{nmin} – {nmax}{nmax >= PIECES_MAX ? '+' : ''}</em>
		</div>
		<DualRange
			min={0}
			max={PIECES_MAX}
			step={50}
			bind:low={nmin}
			bind:high={nmax}
			label="Nombre de pièces"
		/>
	</div>

	<div class="sheet-sec">
		<div class="sheet-label">Statut</div>
		<div class="opts">
			{#each Object.entries(STATUS_LABELS) as [v, l] (v)}
				<label class="opt"
					><input type="radio" name="status" value={v} bind:group={status} /><span>{l}</span></label
				>
			{/each}
		</div>
	</div>

	<div class="sheet-actions">
		<button class="btn btn-ghost" type="button" onclick={onclose}>Annuler</button>
		<button class="btn btn-primary" type="button" onclick={() => onapply(draft)}>
			{countUrl && count != null ? `Voir ${formatSets(count)}` : 'Appliquer'}
		</button>
	</div>
</Sheet>
