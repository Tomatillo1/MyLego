<script lang="ts">
	import Loader from '$lib/components/Loader.svelte';
	import type { PageProps } from './$types';
	import { invalidate } from '$app/navigation';
	import Priority from '$lib/components/Priority.svelte';

	let props: PageProps = $props();

	const legoCollectionOrNot = (legoId: string) => {
		return props.data.user?.collection.some((item) => item.id === legoId);
	};
	const legoWLOrNot = (legoId: string | null) => {
		return props.data.user?.wishlistItems.some((item) => item.legoId === legoId);
	};

	let loaderOn = $derived(props.data ? false : false);
	let prioritySelectorOn = $state(false);
	let selectedIdLegoWL: string | null = $state(null);
	let userId = 'dff89fe8-baac-421e-b5f3-75b9584264b1';
	const addOrRemoveLegoCollection = async (legoId: string) => {
		loaderOn = true;
		let addOrRemove = false;
		if (!legoCollectionOrNot(legoId)) {
			addOrRemove = true;
		} else {
			addOrRemove = false;
		}
		await fetch('/api/changeCollection', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ legoId, userId, addOrRemove })
		});
		invalidate('app:legosList');
	};
	const addLegoWL = async (priority: string) => {
		loaderOn = true;
		prioritySelectorOn = false;
		let addOrRemove = false;
		if (!legoWLOrNot(selectedIdLegoWL)) {
			addOrRemove = true;
		} else {
			addOrRemove = false;
		}
		await fetch('/api/addWishlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ priority, userId, selectedIdLegoWL, addOrRemove })
		});
		invalidate('app:legosList');
	};
</script>

<main class="flex flex-col pt-4 relative">
	{#if loaderOn}
		<div class="absolute top-0 left-0 w-full h-screen bg-black opacity-50">
			<Loader classLoader="top-1/2 left-1/2 absolute -translate-1/2" />
		</div>
	{/if}
	<h1 class="text-center font-bold text-xl">All the legos</h1>
	<section class="grid grid-cols-3 pt-4">
		{#each props.data.legos as lego (lego.id)}
			<div class="p-2">
				<img
					class="flex flex-col border-2 border-black rounded-4xl w-full aspect-square object-cover"
					src={lego.imageUrl}
					alt=""
				/>
				<h2 class="text-center">{lego.name}</h2>
				<div class="flex flex-col gap-2">
					<button onclick={() => addOrRemoveLegoCollection(lego.id)} class="border-2 border-black"
						>{legoCollectionOrNot(lego.id) ? 'Delete from collection' : 'Add to collection'}</button
					>
					<button
						onclick={() => {
							selectedIdLegoWL = lego.id;
							if (legoWLOrNot(lego.id)) {
								addLegoWL('');
							} else {
								prioritySelectorOn = true;
							}
						}}
						class="border-2 border-black"
						>{legoWLOrNot(lego.id) ? 'Delete from wishlist' : 'Add to wishlist'}</button
					>
				</div>
			</div>
		{/each}
		{#if prioritySelectorOn}
			<Priority addLego={addLegoWL} />
		{/if}
	</section>
</main>
