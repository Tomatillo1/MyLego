<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		sub?: Snippet | string;
		art?: boolean;
		icon?: string;
		check?: boolean;
	};
	let { title, sub, art = false, icon, check = false }: Props = $props();
</script>

<div class="auth-hero" class:left={!art}>
	{#if art}
		<div class="auth-art">
			<div class="art">
				<span class="brick b2" style="--n:2"></span><span class="brick b3" style="--n:3"
				></span><span class="brick b1" style="--n:4"></span>
			</div>
		</div>
		<div class="logo">
			<span class="logo-mark"
				><div class="art"><span class="brick b1" style="--n:2"></span></div></span
			>myLego
		</div>
	{:else if icon}
		<div class="big-icon">
			<Icon name={icon} />
			{#if check}<span class="check-badge"><Icon name="check" /></span>{/if}
		</div>
	{/if}
	<h1>{title}</h1>
	{#if typeof sub === 'string'}<p class="sub">{sub}</p>{:else if sub}<p class="sub">
			{@render sub()}
		</p>{/if}
</div>
