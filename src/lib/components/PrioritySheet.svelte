<script lang="ts">
	import { PRIORITIES, PRIORITY_META, type Priority } from '$lib/domain';
	import Sheet from './Sheet.svelte';
	import Icon from './Icon.svelte';
	import MiniSet from './MiniSet.svelte';

	type Props = {
		open: boolean;
		title: string;
		confirmLabel: string;
		lego: { name: string; setNumber: string; priceCents: number; imageUrl: string } | null;
		initial?: Priority;
		onconfirm: (p: Priority) => void;
		onclose: () => void;
	};
	let {
		open,
		title,
		confirmLabel,
		lego,
		initial = 'MANDATORY',
		onconfirm,
		onclose
	}: Props = $props();
	let selected = $state<Priority>('MANDATORY');
	$effect(() => {
		if (open) selected = initial;
	});
</script>

<Sheet {open} label={title} {onclose}>
	<div class="sheet-head">
		<h3>{title}</h3>
		<button class="sheet-close" type="button" aria-label="Fermer" onclick={onclose}
			><Icon name="x" /></button
		>
	</div>
	{#if lego}<MiniSet {lego} />{/if}
	<div class="prio-list" role="radiogroup" aria-label="Priorité">
		{#each PRIORITIES as p (p)}
			{@const m = PRIORITY_META[p]}
			<label class="prio-opt {m.cls}">
				<input type="radio" name="priority" value={p} bind:group={selected} />
				<span class="prio-row">
					<span class="dot"></span>
					<span class="txt"><b>{m.label}</b><small>{m.hint}</small></span>
					<span class="tick"><Icon name="check" /></span>
				</span>
			</label>
		{/each}
	</div>
	<div class="sheet-actions">
		<button class="btn btn-ghost" type="button" onclick={onclose}>Annuler</button>
		<button class="btn btn-primary" type="button" onclick={() => onconfirm(selected)}
			>{confirmLabel}</button
		>
	</div>
</Sheet>
