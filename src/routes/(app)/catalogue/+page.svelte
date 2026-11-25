<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { formatSets, type Priority } from '$lib/domain';
	import { filtersHref, type FilterState } from '$lib/filters';
	import { collect, pending, uncollect, unwish, wish } from '$lib/set-ops.svelte';
	import { showToast } from '$lib/toast.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FilterSheet from '$lib/components/FilterSheet.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import PrioritySheet from '$lib/components/PrioritySheet.svelte';
	import SetCard, { type CardLego } from '$lib/components/SetCard.svelte';
	import SkeletonGrid from '$lib/components/SkeletonGrid.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const DEFAULT_SORT = 'relevance';
	const SORTS = ['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'pieces_desc'];

	let filtersOpen = $state(false);
	let wishTarget = $state<CardLego | null>(null);
	const loading = $derived(
		navigating.to?.url.pathname === page.url.pathname &&
			navigating.from?.url.pathname !== page.url.pathname
	);
	const hasFilters = $derived(page.url.search.length > 0);

	function toggleWish(l: CardLego) {
		if (l.wishPriority) return unwish(l.id, l.wishPriority);
		if (l.inCollection)
			return showToast({
				title: 'Déjà dans ta collection',
				sub: 'Un set ne peut pas être dans les deux.'
			});
		wishTarget = l;
	}
	function confirmWish(p: Priority) {
		const t = wishTarget;
		wishTarget = null;
		if (t) wish(t.id, p);
	}
	function applyFilters(f: FilterState) {
		filtersOpen = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- chemin résolu + query string
		goto(filtersHref(resolve('/catalogue'), f), { noScroll: true });
	}
</script>

<svelte:head><title>Catalogue · myLego</title></svelte:head>

<main class="content">
	<OfflineBanner />
	<div class="page-head">
		<h1>Catalogue</h1>
		<span class="count">{loading ? 'Chargement…' : formatSets(data.legos.length)}</span>
	</div>
	<Toolbar
		filters={data.filters}
		defaultSort={DEFAULT_SORT}
		onopenfilters={() => (filtersOpen = true)}
	/>

	{#if loading}
		<SkeletonGrid />
	{:else if data.legos.length === 0}
		{#if hasFilters}
			<EmptyState
				title="Aucun résultat"
				text={data.filters.q
					? `Aucun set ne correspond à « ${data.filters.q} » avec ces filtres. Essaie un autre mot ou un n° de set.`
					: 'Aucun set ne correspond à ces filtres.'}
				cta={{ label: 'Réinitialiser les filtres', href: resolve('/catalogue') }}
			/>
		{:else}
			<EmptyState title="Catalogue vide" text="Aucun set n’a encore été ajouté au catalogue." art />
		{/if}
	{:else}
		<div class="grid">
			{#each data.legos as lego (lego.id)}
				<SetCard
					{lego}
					variant="catalogue"
					disabled={pending.ids.has(lego.id)}
					ontogglecollection={() => (lego.inCollection ? uncollect(lego.id) : collect(lego.id))}
					ontogglewish={() => toggleWish(lego)}
				/>
			{/each}
		</div>
	{/if}
</main>

<FilterSheet
	open={filtersOpen}
	filters={data.filters}
	facets={data.facets}
	sorts={SORTS}
	defaultSort={DEFAULT_SORT}
	countUrl="/catalogue/count"
	onapply={applyFilters}
	onclose={() => (filtersOpen = false)}
/>
<PrioritySheet
	open={!!wishTarget}
	title="Quelle priorité ?"
	confirmLabel="Ajouter"
	lego={wishTarget}
	onconfirm={confirmWish}
	onclose={() => (wishTarget = null)}
/>
