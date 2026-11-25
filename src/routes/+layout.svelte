<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import IconSprite from '$lib/components/IconSprite.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<IconSprite />
{@render children()}
