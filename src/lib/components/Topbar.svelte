<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = { title: string; back?: string };
	let { title, back }: Props = $props();

	function goBack(e: MouseEvent) {
		// Retour à la page d'origine si on vient de l'app, sinon lien de repli
		if (history.length > 1 && document.referrer.startsWith(location.origin)) {
			e.preventDefault();
			history.back();
		}
	}
</script>

<div class="topbar">
	{#if back}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- l’appelant passe un href résolu -->
		<a class="round-btn" href={back} aria-label="Retour" onclick={goBack}><Icon name="back" /></a>
	{:else}
		<span class="round-btn ghost"></span>
	{/if}
	<h1 class="topbar-title">{title}</h1>
	<span class="round-btn ghost"></span>
</div>
