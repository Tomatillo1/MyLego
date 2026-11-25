<script lang="ts">
	type Props = {
		min: number;
		max: number;
		step?: number;
		low: number;
		high: number;
		label: string;
	};
	let { min, max, step = 1, low = $bindable(), high = $bindable(), label }: Props = $props();
	const pct = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
</script>

<div class="dual" style="--a:{pct(low)}%; --b:{pct(high)}%">
	<span class="track"></span><span class="fillbar"></span>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value={low}
		oninput={() => low > high && (low = high)}
		aria-label="{label} minimum"
	/>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value={high}
		oninput={() => high < low && (high = low)}
		aria-label="{label} maximum"
	/>
</div>
