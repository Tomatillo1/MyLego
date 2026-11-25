<script lang="ts">
	let { count = 6 }: { count?: number } = $props();
</script>

<div class="grid" aria-busy="true" aria-label="Chargement">
	{#each { length: count }, i (i)}
		<div class="card loading">
			<div class="media skel"></div>
			<div class="body">
				<span class="skel skel-line"></span><span class="skel skel-line w60"></span><span
					class="skel skel-line w40"
				></span>
			</div>
		</div>
	{/each}
</div>
