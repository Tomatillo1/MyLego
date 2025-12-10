<script lang="ts">
	import type { PageProps } from './$types';
	import { invalidate } from '$app/navigation';

	let props: PageProps = $props();

	const legoCollectionOrNot = (legoId: string) => {
		return props.data.user?.collection.some((item) => item.id === legoId);
	};

	let userId = 'dff89fe8-baac-421e-b5f3-75b9584264b1';
	const addOrRemoveLegoCollection = async (legoId: string) => {
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
</script>

<main class="flex flex-col pt-4">
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
						>{legoCollectionOrNot(lego.id) ? 'Delete' : 'Add'}</button
					>
					<button class="border-2 border-black">Add to wishlist</button>
				</div>
			</div>
		{/each}
	</section>
</main>
