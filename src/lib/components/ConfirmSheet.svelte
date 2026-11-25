<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sheet from './Sheet.svelte';
	import Icon from './Icon.svelte';

	type Props = {
		open: boolean;
		title: string;
		text: string;
		icon?: string;
		confirmLabel: string;
		danger?: boolean;
		busy?: boolean;
		onconfirm: () => void;
		onclose: () => void;
		children?: Snippet;
	};
	let {
		open,
		title,
		text,
		icon = 'trash',
		confirmLabel,
		danger = true,
		busy = false,
		onconfirm,
		onclose,
		children
	}: Props = $props();
</script>

<Sheet {open} label={title} {onclose} confirm>
	<div class="big-icon" class:danger><Icon name={icon} /></div>
	<h3>{title}</h3>
	<p>{text}</p>
	{@render children?.()}
	<div class="sheet-actions">
		<button class="btn btn-ghost" type="button" onclick={onclose}>Annuler</button>
		<button
			class="btn {danger ? 'btn-danger' : 'btn-primary'}"
			type="button"
			disabled={busy}
			onclick={onconfirm}
		>
			{confirmLabel}
		</button>
	</div>
</Sheet>
