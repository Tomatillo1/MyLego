<script lang="ts">
	import type { PageProps } from './$types';
	import { invalidate } from '$app/navigation';

	let props: PageProps = $props();

	let userId = 'dff89fe8-baac-421e-b5f3-75b9584264b1';
	const deleteLego = async (legoId: string) => {
		await fetch('/api/deleteCollection', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ legoId, userId })
		});
		invalidate('app:deleteLegoCollection');
	};
</script>

<main class="flex flex-col pt-4">
	<h1 class="text-center font-bold text-xl">All the legos</h1>
	<section class="grid grid-cols-3 pt-4">
		{#each props.data.userCollection?.collection as lego (lego.id)}
			<div class="p-2 flex flex-col items-center gap-2">
				<img
					class="flex flex-col border-2 border-black rounded-4xl w-full aspect-square object-cover"
					src={lego.imageUrl}
					alt=""
				/>
				<h2 class="text-center">{lego.name}</h2>
				<button onclick={() => deleteLego(lego.id)} class="border-2 border-black px-4 py-1"
					>Delete</button
				>
			</div>
		{/each}
	</section>
</main>
