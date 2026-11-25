<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { formatInt, formatPrice, formatSets } from '$lib/domain';
	import { filtersHref, type FilterState } from '$lib/filters';
	import { pending, uncollect } from '$lib/set-ops.svelte';
	import ConfirmSheet from '$lib/components/ConfirmSheet.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FilterSheet from '$lib/components/FilterSheet.svelte';
	import MiniSet from '$lib/components/MiniSet.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import SetCard, { type CardLego } from '$lib/components/SetCard.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const DEFAULT_SORT = 'name_asc';
	const SORTS = ['name_asc', 'name_desc', 'price_desc', 'price_asc', 'pieces_desc', 'recent'];

	let filtersOpen = $state(false);
	let toRemove = $state<(CardLego & { priceCents: number }) | null>(null);

	function confirmRemove() {
		const t = toRemove;
		toRemove = null;
		if (t) uncollect(t.id, false);
	}
	function applyFilters(f: FilterState) {
		filtersOpen = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- chemin résolu + query string
		goto(filtersHref(resolve('/collection'), f), { noScroll: true });
	}
</script>

<svelte:head><title>Ma collection · myLego</title></svelte:head>

<main class="content">
	<OfflineBanner />
	<div class="page-head">
		<h1>Collection</h1>
		<span class="count">{formatSets(data.totals.count)}</span>
	</div>

	{#if data.totals.count === 0}
		<EmptyState
			art
			title="Ta collection est vide"
			text="Ajoute tes premiers sets depuis le catalogue en touchant l’icône brique."
			cta={{ label: 'Explorer le catalogue', href: resolve('/catalogue') }}
		/>
	{:else}
		<div class="hero">
			<div class="hero-label">Valeur de ma collection</div>
			<div class="hero-big">{formatPrice(data.totals.valueCents)}</div>
			<div class="hero-row">
				<span><b>{formatInt(data.totals.count)}</b> {data.totals.count > 1 ? 'sets' : 'set'}</span>
				<span><b>{formatInt(data.totals.pieces)}</b> pièces</span>
			</div>
		</div>
		<Toolbar
			filters={data.filters}
			defaultSort={DEFAULT_SORT}
			onopenfilters={() => (filtersOpen = true)}
		/>
		{#if data.items.length === 0}
			<EmptyState
				title="Aucun résultat"
				text="Aucun set de ta collection ne correspond à ces filtres."
				cta={{ label: 'Réinitialiser les filtres', href: resolve('/collection') }}
			/>
		{:else}
			<div class="grid">
				{#each data.items as lego (lego.id)}
					<SetCard
						{lego}
						variant="collection"
						disabled={pending.ids.has(lego.id)}
						onremove={() => (toRemove = lego)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</main>

<FilterSheet
	open={filtersOpen}
	filters={data.filters}
	facets={data.facets}
	sorts={SORTS}
	defaultSort={DEFAULT_SORT}
	onapply={applyFilters}
	onclose={() => (filtersOpen = false)}
/>
<ConfirmSheet
	open={!!toRemove}
	title="Retirer ce set ?"
	text="Il sera retiré de ta collection. Tu pourras le rajouter depuis le catalogue."
	confirmLabel="Retirer"
	onconfirm={confirmRemove}
	onclose={() => (toRemove = null)}
>
	{#if toRemove}<MiniSet lego={toRemove} />{/if}
</ConfirmSheet>
