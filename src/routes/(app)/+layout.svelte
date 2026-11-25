<script lang="ts">
	import { page } from '$app/state';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	// La fiche set et le profil ont leur propre barre de titre (maquettes)
	const ownTopbar = $derived(
		page.route.id?.startsWith('/(app)/sets') || page.route.id?.startsWith('/(app)/profil')
	);
</script>

<div class="screen">
	{#if !ownTopbar}<AppHeader
			username={data.user.username}
			avatarVersion={data.user.avatarVersion}
		/>{/if}
	{@render children()}
	<Toast />
	<NavBar collection={data.counts.collection} wishlist={data.counts.wishlist} />
</div>
