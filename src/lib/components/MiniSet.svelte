<script lang="ts">
	import { formatPrice } from '$lib/domain';
	import SetMedia from './SetMedia.svelte';

	type Props = { lego: { name: string; setNumber: string; priceCents: number; imageUrl: string } };
	let { lego }: Props = $props();
</script>

<div class="mini">
	<div class="mini-media">
		<SetMedia imageUrl={lego.imageUrl} seed={lego.setNumber} size={4.2} />
	</div>
	<div class="mini-txt">
		<b>{lego.name}</b><span>#{lego.setNumber} · {formatPrice(lego.priceCents)}</span>
	</div>
</div>
