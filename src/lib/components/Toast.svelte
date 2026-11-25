<script lang="ts">
	import { toast, hideToast } from '$lib/toast.svelte';
	import Icon from './Icon.svelte';
</script>

{#if toast.current}
	{#key toast.current.id}
		<div class="toast" role="status" aria-live="polite">
			<span class="toast-ico"><Icon name="check" /></span>
			<span class="toast-txt"
				><b>{toast.current.title}</b>{#if toast.current.sub}<span>{toast.current.sub}</span
					>{/if}</span
			>
			{#if toast.current.action}
				{@const a = toast.current.action}
				<button type="button" onclick={() => (hideToast(), a.run())}>{a.label}</button>
			{/if}
		</div>
	{/key}
{/if}
