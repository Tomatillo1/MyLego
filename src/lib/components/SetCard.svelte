<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatPrice, PRIORITY_META, type Priority } from '$lib/domain';
	import Icon from './Icon.svelte';
	import SetMedia from './SetMedia.svelte';

	export type CardLego = {
		id: string;
		name: string;
		setNumber: string;
		priceCents: number;
		imageUrl: string;
		retired: boolean;
		inCollection: boolean;
		wishPriority: Priority | null;
	};
	type Props = {
		lego: CardLego;
		variant: 'catalogue' | 'collection' | 'wishlist';
		disabled?: boolean;
		ontogglecollection?: () => void;
		ontogglewish?: () => void;
		onremove?: () => void;
		onpriority?: () => void;
	};
	let {
		lego,
		variant,
		disabled = false,
		ontogglecollection,
		ontogglewish,
		onremove,
		onpriority
	}: Props = $props();
	const href = $derived(resolve('/(app)/sets/[setNumber]', { setNumber: lego.setNumber }));
	const prio = $derived(lego.wishPriority ? PRIORITY_META[lego.wishPriority] : null);
</script>

<article class="card" data-id={lego.id}>
	<div class="media">
		{#if lego.retired}<span class="badge-retired">Retiré</span>{/if}
		{#if variant === 'catalogue'}
			<div class="toggles">
				<label class="tog tog-col">
					<input
						type="checkbox"
						checked={lego.inCollection}
						{disabled}
						onchange={(e) => (
							(e.currentTarget.checked = lego.inCollection),
							ontogglecollection?.()
						)}
						aria-label="{lego.inCollection
							? 'Retirer de la collection'
							: 'Ajouter à la collection'} : {lego.name}"
					/>
					<Icon name="brick" class="off" /><Icon name="brick" fill class="on" />
				</label>
				<label class="tog tog-wish">
					<input
						type="checkbox"
						checked={!!lego.wishPriority}
						{disabled}
						onchange={(e) => ((e.currentTarget.checked = !!lego.wishPriority), ontogglewish?.())}
						aria-label="{lego.wishPriority
							? 'Retirer de la wishlist'
							: 'Ajouter à la wishlist'} : {lego.name}"
					/>
					<Icon name="heart" class="off" /><Icon name="heart" fill class="on" />
				</label>
			</div>
		{/if}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href résolu ci-dessus -->
		<a {href} aria-label="Voir {lego.name}"
			><SetMedia imageUrl={lego.imageUrl} seed={lego.setNumber} /></a
		>
	</div>
	<div class="body">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href résolu ci-dessus -->
		<h3 class="name"><a {href}>{lego.name}</a></h3>
		<span class="price">{formatPrice(lego.priceCents)}</span>
		{#if variant === 'collection'}
			<div class="card-actions">
				<button class="btn-sm danger" type="button" {disabled} onclick={onremove}
					><Icon name="trash" />Retirer</button
				>
			</div>
		{:else if variant === 'wishlist' && prio}
			<div class="card-actions">
				<button
					class="btn-sm danger square"
					type="button"
					{disabled}
					aria-label="Retirer de la wishlist : {lego.name}"
					onclick={onremove}
				>
					<Icon name="trash" />
				</button>
				<button
					class="prio {prio.cls}"
					type="button"
					{disabled}
					aria-label="Priorité {prio.label.toLowerCase()}, modifier"
					onclick={onpriority}
				>
					<span class="dot"></span>{prio.label}
				</button>
			</div>
		{/if}
	</div>
</article>
