<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Icon from './Icon.svelte';

	type Props = { collection: number; wishlist: number };
	let { collection, wishlist }: Props = $props();
	const path = $derived(page.url.pathname);
</script>

<nav class="navbar" aria-label="Navigation principale">
	<a
		class="nav-item"
		class:active={path.startsWith('/collection')}
		href={resolve('/collection')}
		aria-current={path.startsWith('/collection') ? 'page' : undefined}
	>
		<Icon name="brick" class="nav-brick" />{#if collection}<span class="badge">{collection}</span
			>{/if}Collection
	</a>
	<a
		class="nav-item center"
		class:active={path.startsWith('/catalogue')}
		href={resolve('/catalogue')}
		aria-current={path.startsWith('/catalogue') ? 'page' : undefined}
	>
		<span class="bubble"><Icon name="grid" /></span>Catalogue
	</a>
	<a
		class="nav-item"
		class:active={path.startsWith('/wishlist')}
		href={resolve('/wishlist')}
		aria-current={path.startsWith('/wishlist') ? 'page' : undefined}
	>
		<Icon name="heart" />{#if wishlist}<span class="badge">{wishlist}</span>{/if}Wishlist
	</a>
</nav>
