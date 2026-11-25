<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AuthHero from '$lib/components/AuthHero.svelte';
	import Field from '$lib/components/Field.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Connexion · myLego</title></svelte:head>

<AuthHero art title="Bon retour !" sub="Connecte-toi pour retrouver ta collection." />

<form
	method="POST"
	action="?{page.url.searchParams.has('next')
		? `next=${encodeURIComponent(page.url.searchParams.get('next') ?? '')}`
		: ''}"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	}}
	novalidate
>
	{#if data.reset}<p class="form-error" style="background:var(--warn-soft);color:var(--warn-text)">
			Mot de passe modifié. Tu peux te connecter.
		</p>{/if}
	{#if form?.errors?.form}<p class="form-error" role="alert">{form.errors.form}</p>{/if}
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
	<Field
		label="Mot de passe"
		name="password"
		icon="lock"
		type="password"
		autocomplete="current-password"
		required
		reveal
		error={form?.errors?.password}
	/>
	<div class="form-row end">
		<a class="link" href={resolve('/forgot-password')}>Mot de passe oublié ?</a>
	</div>
	<button class="btn btn-primary" type="submit" disabled={busy}>Se connecter</button>
</form>
<p class="auth-foot">
	Pas encore de compte ? <a class="link" href={resolve('/register')}>Créer un compte</a>
</p>
