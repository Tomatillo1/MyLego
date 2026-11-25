<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import EmptyState from '$lib/components/EmptyState.svelte';
</script>

<svelte:head><title>{page.status} · myLego</title></svelte:head>

<div class="screen">
	<main class="content" style="display:grid;place-items:center">
		<EmptyState
			art
			title={page.status === 404 ? 'Page introuvable' : 'Oups, une erreur'}
			text={page.status === 404
				? 'Cette page ou ce set n’existe pas.'
				: 'Quelque chose s’est mal passé. Réessaie dans un instant.'}
			cta={{ label: 'Retour au catalogue', href: resolve('/catalogue') }}
		/>
	</main>
</div>
