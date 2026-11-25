<script lang="ts">
	import { network } from '$lib/online.svelte';
	import Icon from './Icon.svelte';
</script>

{#if !network.online}
	<div class="offline" role="status">
		<Icon name="wifi-off" />Hors ligne — affichage de ta dernière synchronisation
	</div>
{/if}
