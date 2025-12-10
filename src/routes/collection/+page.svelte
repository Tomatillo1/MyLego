<script lang="ts">
	import type { PageProps } from './$types';

	let props: PageProps = $props();
	$inspect(props.data.userCollection?.collection);
</script>

<main class="flex flex-col pt-4">
	<h1 class="text-center font-bold text-xl">All the legos</h1>
	<section class="grid grid-cols-3 pt-4">
		{#each props.data.userCollection?.collection as lego (lego.id)}
			<div class="p-2">
				<img
					class="flex flex-col border-2 border-black rounded-4xl w-full aspect-square object-cover"
					src={lego.imageUrl}
					alt=""
				/>
				<h2 class="text-center">{lego.name}</h2>
			</div>
		{/each}
	</section>
</main>
