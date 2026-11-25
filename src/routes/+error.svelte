<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { network } from '$lib/online.svelte';

	// Données injoignables (hors ligne ou réseau coupé) : message dédié plutôt que « Oups »
	const offline = $derived(!network.online || page.status === 503);
</script>

<svelte:head><title>{page.status} · myLego</title></svelte:head>

<div class="screen">
	<main class="content" style="display:grid;place-items:center">
		{#if offline}
			<EmptyState
				art
				title="Pas de connexion"
				text="Cette page n’est pas disponible hors ligne. Reconnecte-toi puis réessaie."
				cta={{ label: 'Réessayer', href: page.url.pathname + page.url.search }}
			/>
		{:else}
			<EmptyState
				art
				title={page.status === 404 ? 'Page introuvable' : 'Oups, une erreur'}
				text={page.status === 404
					? 'Cette page ou ce set n’existe pas.'
					: 'Quelque chose s’est mal passé. Réessaie dans un instant.'}
				cta={{ label: 'Retour au catalogue', href: resolve('/catalogue') }}
			/>
		{/if}
	</main>
</div>
