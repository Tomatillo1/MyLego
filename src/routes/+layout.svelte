<script lang="ts">
	import './layout.css';
	import IconSprite from '$lib/components/IconSprite.svelte';
	import { beforeNavigate } from '$app/navigation';

	let { children } = $props();

	// Hors ligne, une navigation interne ne chargerait que les données de la page (__data.json),
	// rarement en cache. On force un chargement complet : le service worker sert alors la page
	// enregistrée, ou la page « Pas disponible hors ligne ».
	beforeNavigate((nav) => {
		if (navigator.onLine || !nav.to || nav.willUnload || nav.type === 'form') return;
		if (nav.to.url.origin !== location.origin) return;
		nav.cancel();
		location.assign(nav.to.url.href);
	});
</script>

<IconSprite />
{@render children()}
