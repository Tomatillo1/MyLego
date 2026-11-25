<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { activeChips, filtersHref, type FilterState } from '$lib/filters';
	import Icon from './Icon.svelte';

	type Props = { filters: FilterState; defaultSort: string; onopenfilters: () => void };
	let { filters, defaultSort, onopenfilters }: Props = $props();

	let q = $derived(filters.q);
	const chips = $derived(activeChips(filters, defaultSort));

	let t: ReturnType<typeof setTimeout>;
	function onSearch() {
		clearTimeout(t);
		t = setTimeout(() => apply({ ...filters, q: q.trim() }), 300);
	}
	function apply(f: FilterState) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- même route, seule la query string change
		goto(filtersHref(page.url.pathname, f), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}
</script>

<form
	class="toolbar"
	role="search"
	onsubmit={(e) => (e.preventDefault(), clearTimeout(t), apply({ ...filters, q: q.trim() }))}
>
	<label class="search">
		<Icon name="search" />
		<input
			type="search"
			name="q"
			placeholder="Rechercher un set, un n°…"
			maxlength="80"
			bind:value={q}
			oninput={onSearch}
			aria-label="Rechercher"
		/>
	</label>
	<button class="icon-btn" type="button" aria-label="Filtrer et trier" onclick={onopenfilters}>
		<Icon name="sliders" />
		{#if chips.length}<span class="dot-count">{chips.length}</span>{/if}
	</button>
</form>
{#if chips.length}
	<div class="chips">
		{#each chips as c (c.key)}
			<span class="chip">
				{c.label}
				<button
					type="button"
					aria-label="Retirer le filtre {c.label}"
					onclick={() => apply(c.without)}><Icon name="x" /></button
				>
			</span>
		{/each}
	</div>
{/if}
