<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { formatPrice, formatSets, type Priority, type WishSegment } from '$lib/domain';
	import { filtersHref, type FilterState } from '$lib/filters';
	import { pending, setPriority, unwish } from '$lib/set-ops.svelte';
	import ConfirmSheet from '$lib/components/ConfirmSheet.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FilterSheet from '$lib/components/FilterSheet.svelte';
	import MiniSet from '$lib/components/MiniSet.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import PrioritySheet from '$lib/components/PrioritySheet.svelte';
	import SetCard, { type CardLego } from '$lib/components/SetCard.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const DEFAULT_SORT = 'priority';
	const SORTS = ['priority', 'price_desc', 'price_asc', 'name_asc', 'name_desc', 'recent'];
	const SEGMENTS: { key: WishSegment; label: string }[] = [
		{ key: 'all', label: 'Toutes' },
		{ key: 'highMid', label: 'Haute + Moy.' },
		{ key: 'high', label: 'Haute' }
	];

	let segment = $state<WishSegment>('all');
	let filtersOpen = $state(false);
	let toRemove = $state<CardLego | null>(null);
	let toEdit = $state<CardLego | null>(null);
	const segId = $props.id();

	function confirmRemove() {
		const t = toRemove;
		toRemove = null;
		if (t?.wishPriority) unwish(t.id, t.wishPriority);
	}
	function confirmPriority(p: Priority) {
		const t = toEdit;
		toEdit = null;
		if (t && p !== t.wishPriority) setPriority(t.id, p);
	}
	function applyFilters(f: FilterState) {
		filtersOpen = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- chemin résolu + query string
		goto(filtersHref(resolve('/wishlist'), f), { noScroll: true });
	}
</script>

<svelte:head><title>Ma wishlist · myLego</title></svelte:head>

<main class="content">
	<OfflineBanner />
	<div class="page-head">
		<h1>Wishlist</h1>
		<span class="count">{formatSets(data.totals.all.count)}</span>
	</div>

	{#if data.totals.all.count === 0}
		<EmptyState
			icon="heart"
			title="Aucune envie pour l’instant"
			text="Touche le cœur d’un set dans le catalogue pour l’ajouter avec une priorité."
			cta={{ label: 'Trouver des sets', href: resolve('/catalogue') }}
		/>
	{:else}
		<div class="hero alt">
			{#each SEGMENTS as s (s.key)}
				<input type="radio" name="wseg" id="{segId}-{s.key}" value={s.key} bind:group={segment} />
			{/each}
			<div class="hero-label">Budget wishlist</div>
			<div class="hero-big" aria-live="polite">
				{#each SEGMENTS as s, i (s.key)}
					<span class="v v{i + 1}"
						>{formatPrice(data.totals[s.key].valueCents)}<small
							>{formatSets(data.totals[s.key].count)}</small
						></span
					>
				{/each}
			</div>
			<div class="seg">
				{#each SEGMENTS as s (s.key)}<label for="{segId}-{s.key}">{s.label}</label>{/each}
				<span class="seg-ind"></span>
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
				text="Aucun set de ta wishlist ne correspond à ces filtres."
				cta={{ label: 'Réinitialiser les filtres', href: resolve('/wishlist') }}
			/>
		{:else}
			<div class="grid">
				{#each data.items as lego (lego.id)}
					<SetCard
						{lego}
						variant="wishlist"
						disabled={pending.ids.has(lego.id)}
						onremove={() => (toRemove = lego)}
						onpriority={() => (toEdit = lego)}
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
<PrioritySheet
	open={!!toEdit}
	title="Modifier la priorité"
	confirmLabel="Enregistrer"
	lego={toEdit}
	initial={toEdit?.wishPriority ?? 'MANDATORY'}
	onconfirm={confirmPriority}
	onclose={() => (toEdit = null)}
/>
<ConfirmSheet
	open={!!toRemove}
	title="Retirer de la wishlist ?"
	text="Ce set ne sera plus suivi dans ta wishlist."
	confirmLabel="Retirer"
	onconfirm={confirmRemove}
	onclose={() => (toRemove = null)}
>
	{#if toRemove}<MiniSet lego={toRemove} />{/if}
</ConfirmSheet>
