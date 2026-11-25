<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		text: string;
		cta?: { label: string; href: string };
		icon?: string;
		art?: boolean;
	};
	let { title, text, cta, icon = 'search', art = false }: Props = $props();
</script>

<div class="empty">
	{#if art}
		<div class="empty-art">
			<div class="art">
				<span class="brick b3" style="--n:2"></span><span class="brick b1" style="--n:3"
				></span><span class="brick b2" style="--n:4"></span>
			</div>
		</div>
	{:else}
		<div class="big-icon"><Icon name={icon} /></div>
	{/if}
	<h3>{title}</h3>
	<p>{text}</p>
	{#if cta}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- l’appelant passe un href résolu -->
		<a class="btn btn-primary" href={cta.href}>{cta.label}</a>
	{/if}
</div>
