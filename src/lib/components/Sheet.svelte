<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		open: boolean;
		label: string;
		onclose: () => void;
		confirm?: boolean;
		children: Snippet;
	};
	let { open, label, onclose, confirm = false, children }: Props = $props();
	let sheet: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!open || !sheet) return;
		const prev = document.activeElement as HTMLElement | null;
		const first = sheet.querySelector<HTMLElement>(
			'input:checked, input, button, [href], select, textarea'
		);
		first?.focus({ preventScroll: true });
		return () => prev?.focus?.({ preventScroll: true });
	});

	function onkeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
		}
		if (e.key === 'Tab' && sheet) {
			const items = [
				...sheet.querySelectorAll<HTMLElement>('input, button, [href], select, textarea')
			].filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
			if (!items.length) return;
			const [a, z] = [items[0], items[items.length - 1]];
			if (e.shiftKey && document.activeElement === a) {
				e.preventDefault();
				z.focus();
			} else if (!e.shiftKey && document.activeElement === z) {
				e.preventDefault();
				a.focus();
			}
		}
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="overlay"
		onclick={(e) => e.target === e.currentTarget && onclose()}
		out:fade={{ duration: 150 }}
	>
		<div
			bind:this={sheet}
			class="sheet"
			class:confirm
			role={confirm ? 'alertdialog' : 'dialog'}
			aria-modal="true"
			aria-label={label}
		>
			<span class="grab"></span>
			{@render children()}
		</div>
	</div>
{/if}
