<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthHero from '$lib/components/AuthHero.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let left = $state(0);
	$effect(() => {
		left = data.resendDelay;
		const t = setInterval(() => (left = Math.max(0, left - 1)), 1000);
		return () => clearInterval(t);
	});
	const mmss = $derived(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);
</script>

<svelte:head><title>Vérifie tes emails · myLego</title></svelte:head>

<div style="margin-top:60px"></div>
<AuthHero icon="mail" check title="Vérifie tes emails">
	{#snippet sub()}Si un compte existe pour <b>{data.email}</b>, un lien vient d’être envoyé. Il est
		valable 30 minutes.{/snippet}
</AuthHero>
<a class="btn btn-primary" href={resolve('/login')}>Retour à la connexion</a>
<form
	method="POST"
	action="?/resend"
	use:enhance={() =>
		async ({ update }) => {
			await update();
			left = data.resendDelay;
		}}
>
	<button class="btn btn-ghost" type="submit" style="margin-top:10px" disabled={left > 0}
		>Renvoyer l’email</button
	>
</form>
<p class="timer" aria-live="polite">{left > 0 ? `Nouvel envoi possible dans ${mmss}` : ' '}</p>
<p class="auth-foot">Pas reçu ? Pense à vérifier tes spams.</p>
