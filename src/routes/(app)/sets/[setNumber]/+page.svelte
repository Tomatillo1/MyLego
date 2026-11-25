<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatInt, formatPrice, formatSets, PRIORITY_META, type Priority } from '$lib/domain';
	import { collect, pending, setPriority, uncollect, unwish, wish } from '$lib/set-ops.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import PrioritySheet from '$lib/components/PrioritySheet.svelte';
	import SetMedia from '$lib/components/SetMedia.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const l = $derived(data.lego);
	const prio = $derived(l.wishPriority ? PRIORITY_META[l.wishPriority] : null);
	const busy = $derived(pending.ids.has(l.id));
	let sheet = $state<'add' | 'edit' | null>(null);

	const retireLabel = $derived.by(() => {
		if (!l.removedFromStoreOn) return null;
		const d = new Date(l.removedFromStoreOn).toLocaleDateString('fr-FR', {
			month: 'long',
			year: 'numeric'
		});
		return l.retired ? `Retiré depuis ${d}` : `Retrait prévu : ${d}`;
	});

	function onPriority(p: Priority) {
		const mode = sheet;
		sheet = null;
		if (mode === 'add') wish(l.id, p);
		else if (p !== l.wishPriority) setPriority(l.id, p);
	}
</script>

<svelte:head><title>{l.name} · myLego</title></svelte:head>

<Topbar title="Fiche set" back={resolve('/catalogue')} />
<main class="content">
	<OfflineBanner />
	<div class="detail-media">
		{#if l.retired}<span class="badge-retired">Retiré</span>{/if}
		<SetMedia imageUrl={l.imageUrl} seed={l.setNumber} alt={l.name} size={19} />
	</div>
	<div class="detail-sheet">
		<h1>{l.name}</h1>
		<div class="detail-price">{formatPrice(l.priceCents)}</div>

		<div class="info-grid">
			<div class="info"><Icon name="brick" /><span>Pièces</span><b>{formatInt(l.pieces)}</b></div>
			<div class="info"><Icon name="layers" /><span>Thème</span><b>{l.theme}</b></div>
			<div class="info" title={retireLabel ?? undefined}>
				<Icon name="tag" /><span>Statut</span><b class="status" class:retired={l.retired}
					>{l.retired ? 'Retiré' : 'En vente'}</b
				>
			</div>
			<div class="info"><Icon name="hash" /><span>N° du set</span><b>{l.setNumber}</b></div>
			<div class="info"><Icon name="calendar" /><span>Année</span><b>{l.year ?? '—'}</b></div>
			<div class="info">
				<Icon name="cake" /><span>Âge</span><b>{l.minAge ? `${l.minAge}+` : '—'}</b>
			</div>
		</div>
		{#if retireLabel}<p class="help" style="margin:-8px 0 14px">{retireLabel}</p>{/if}

		{#if l.inCollection}
			<div class="state-box col">
				<span class="state-ico"><Icon name="brick" fill /></span>
				<div class="state-txt">
					<b>Dans ta collection</b>Il fait partie de tes {formatSets(data.counts.collection)}
				</div>
			</div>
			<button
				class="btn btn-outline-danger"
				type="button"
				disabled={busy}
				onclick={() => uncollect(l.id)}><Icon name="trash" />Retirer de ma collection</button
			>
		{:else if prio && l.wishPriority}
			<div class="state-box">
				<span class="state-ico"><Icon name="heart" fill /></span>
				<div class="state-txt"><b>Dans ta wishlist</b>Touche la priorité pour la modifier</div>
				<button
					class="prio {prio.cls}"
					type="button"
					disabled={busy}
					aria-label="Priorité {prio.label.toLowerCase()}, modifier"
					onclick={() => (sheet = 'edit')}><span class="dot"></span>{prio.label}</button
				>
			</div>
			<button class="btn btn-primary" type="button" disabled={busy} onclick={() => collect(l.id)}
				><Icon name="brick" />Ajouter à ma collection</button
			>
			<button
				class="btn btn-ghost"
				type="button"
				disabled={busy}
				onclick={() => l.wishPriority && unwish(l.id, l.wishPriority)}
				><Icon name="heart" />Retirer de la wishlist</button
			>
		{:else}
			<button class="btn btn-primary" type="button" disabled={busy} onclick={() => collect(l.id)}
				><Icon name="brick" />Ajouter à ma collection</button
			>
			<button class="btn btn-ghost" type="button" disabled={busy} onclick={() => (sheet = 'add')}
				><Icon name="heart" />Ajouter à ma wishlist</button
			>
		{/if}
	</div>
</main>

<PrioritySheet
	open={!!sheet}
	title={sheet === 'add' ? 'Quelle priorité ?' : 'Modifier la priorité'}
	confirmLabel={sheet === 'add' ? 'Ajouter' : 'Enregistrer'}
	lego={l}
	initial={l.wishPriority ?? 'MANDATORY'}
	onconfirm={onPriority}
	onclose={() => (sheet = null)}
/>
