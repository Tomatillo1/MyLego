<script lang="ts">
	import { initials } from '$lib/domain';

	type Props = { username: string; version: number | null; xl?: boolean };
	let { username, version, xl = false }: Props = $props();
</script>

{#if version}
	<img src="/profil/avatar?v={version}" alt="" width={xl ? 96 : 44} height={xl ? 96 : 44} />
{:else}
	{initials(username)}
{/if}
