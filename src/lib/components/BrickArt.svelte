<script lang="ts">
	/** Visuel en briques CSS (placeholder d'image), déterministe selon la graine. */
	type Props = { seed: string; size?: number };
	let { seed, size }: Props = $props();

	const bricks = $derived.by(() => {
		let h = 0;
		for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
		const count = 2 + (h % 2);
		return Array.from({ length: count }, (_, i) => {
			const v = (h >>> (i * 5)) & 31;
			return { color: 1 + (v % 6), n: i === count - 1 ? 4 + (v % 2) : 2 + (v % 2) };
		});
	});
</script>

<div class="art" style={size ? `--art:${size}px` : undefined}>
	{#each bricks as b, i (i)}
		<span class="brick b{b.color}" style="--n:{b.n}"></span>
	{/each}
</div>
