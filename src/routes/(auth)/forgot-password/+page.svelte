<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthHero from '$lib/components/AuthHero.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Mot de passe oublié · myLego</title></svelte:head>

<a class="round-btn" href={resolve('/login')} aria-label="Retour"><Icon name="back" /></a>
<AuthHero
	icon="lock"
	title="Mot de passe oublié ?"
	sub="Entre ton email, on t’envoie un lien pour le réinitialiser."
/>

<form
	method="POST"
	novalidate
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update();
			busy = false;
		};
	}}
>
	<Field
		label="Email"
		name="email"
		icon="mail"
		type="email"
		autocomplete="email"
		required
		value={form?.email ?? ''}
		error={form?.errors?.email}
	/>
	<button class="btn btn-primary" type="submit" disabled={busy}>Envoyer le lien</button>
</form>
<p class="auth-foot">
	Tu t’en souviens ? <a class="link" href={resolve('/login')}>Se connecter</a>
</p>
