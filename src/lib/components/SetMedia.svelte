<script lang="ts">
	import BrickArt from './BrickArt.svelte';

	/** Image du set, ou briques si l'image est absente / logo par défaut / en erreur. */
	type Props = { imageUrl: string; seed: string; alt?: string; size?: number };
	let { imageUrl, seed, alt = '', size }: Props = $props();
	let failed = $state(false);
	const usable = $derived(!!imageUrl && !imageUrl.includes('/logos/') && !failed);
</script>

{#if usable}
	<img
		class="set-img"
		src={imageUrl}
		{alt}
		loading="lazy"
		decoding="async"
		onerror={() => (failed = true)}
	/>
{:else}
	<BrickArt {seed} {size} />
{/if}
